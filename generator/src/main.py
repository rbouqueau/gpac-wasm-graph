import os
import re
import json
import subprocess
from tqdm import tqdm
from loguru import logger


# Command execution
def execute(command):
    process = subprocess.Popen(
        command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    stdout, stderr = process.communicate()

    # Remove colors
    stdout = re.sub(r"\x1b\[[0-9;]*m", "", stdout.decode("utf-8"))
    stderr = re.sub(r"\x1b\[[0-9;]*m", "", stderr.decode("utf-8"))
    return stdout, stderr


def gpac(args, err_as_out=False):
    out, err = execute("gpac " + args)
    if err and not err_as_out:
        raise Exception(err)
    return out if not err_as_out else err


def get_codecs():
    out = gpac("-h codecs")
    lines = iter(out.splitlines())

    # List starts after second empty line
    count = 0
    while True:
        line = next(lines)
        if not line:
            count += 1
        if count == 2:
            break

    # Match codec names
    matcher = re.compile(r"(.+):\s*(.+)\s\((.+)\)$")

    codecs = {}
    for line in lines:
        match = matcher.match(line)
        if not match:
            continue

        # Get codec name, description and mime type
        name = match.group(1)
        description = match.group(2)
        mime = match.group(3)

        # Derived values
        capabilities = {
            "raw_input": False,
            "raw_output": False,
            "decoder": False,
            "encoder": False,
        }

        # Post-process name and capabilities
        if " " in name:
            raw = name.split(" ")
            name = raw[0]
            caps = raw[1]
            for cap in caps:
                match cap:
                    case "I":
                        capabilities["raw_input"] = True
                    case "O":
                        capabilities["raw_output"] = True
                    case "D":
                        capabilities["decoder"] = True
                    case "E":
                        capabilities["encoder"] = True
                    case _:
                        continue

        # Post-process mime type
        if "," in mime:
            for m in mime.split(","):
                if "/" in m:
                    mime = m.strip()
                    break

        # Post-process variants
        if "|" in name:
            variants = name.split("|")
            name = variants[0]

            # Add variants
            for variant in variants[1:]:
                codecs[variant] = {
                    "description": description,
                    "variant_of": name,
                    "mime": mime,
                    "capabilities": capabilities,
                }

        codecs[name] = {
            "description": description,
            "mime": mime,
            "capabilities": capabilities,
        }

    # Convert to array
    return [{"name": name, **value} for name, value in codecs.items()]


def get_filters():
    out = gpac("-h filters")
    lines = out.splitlines()

    # Match filter names
    matcher = re.compile(r"(.+):\s(.+)$")

    filters = {}
    for line in lines:
        match = matcher.match(line)
        if match:
            filters[match.group(1)] = {"description": match.group(2)}
    longest = max([len(v) for v in filters.keys()])

    # Get filter properties
    iterator = tqdm(filters.keys(), total=len(filters), desc="Properties")
    for fname in iterator:
        early_exit = False

        iterator.set_description(f"Properties: {fname:<{longest}}")
        out = gpac(f"-hh {fname}")
        lines = iter(out.splitlines())

        # Get metadata
        [next(lines) for _ in range(3)]  # Skip redundant lines
        while True:
            line = next(lines)
            if not line:
                break
            key, value = line.split(": ")
            filters[fname][key.lower()] = value

        # Get body
        body = ""
        while True:
            line = next(lines)
            if "Options (expert):" in line:
                next(lines)  # Skip empty line
                break
            if "No options" in line:
                break
            body += line + "\n"
        filters[fname]["body"] = body

        # Get options
        matchers = {
            "default": re.compile(r"(.+)\s\((.+)\):\s*(.+)"),
            "enum": re.compile(r"\s*\*\s(.+):\s(.+)"),
        }

        options = {}
        while True:
            try:
                line = next(lines)
            except StopIteration:
                early_exit = True
                break

            if "Capabilities Bundle:" in line:
                break

            # Match option
            for key, matcher in matchers.items():
                groups = matcher.match(line)
                if not groups:
                    continue

                match key:
                    case "default":
                        args = groups.group(2).split(", ")
                        arg_type = args[0]
                        has_default = len(args) > 1 and "default" in args[1]

                        def cast(arg):
                            match arg_type:
                                case "uint":
                                    try:
                                        return int(arg)
                                    except ValueError:
                                        return str(arg)  # keep as is
                                case "flt":
                                    return float(arg)
                                case "bool":
                                    return bool(arg)
                                case _:
                                    return str(arg)

                        options[groups.group(1)] = {
                            "type": arg_type,
                            "description": groups.group(3),
                            **(
                                {"default": cast(args[1].split(": ")[1])}
                                if has_default
                                else {}
                            ),
                        }
                        break
                    case "enum":
                        # get last option
                        last = options[list(options.keys())[-1]]
                        last["enum"] = last.get("enum", {})
                        last["enum"][groups.group(1)] = groups.group(2)
                        break
                    case _:
                        break

        filters[fname]["options"] = options

        if early_exit:
            continue

        # Get capabilities
        capabilities = {
            "input": {
                "codec_id": set(),
                "stream_type": set(),
            },
            "output": {
                "codec_id": set(),
                "stream_type": set(),
            },
        }

        matchers = {
            "StreamType": re.compile(r'.*StreamType="(.+)"'),
            "CodecID": re.compile(r'.*CodecID="(.+)"'),
        }

        while True:
            line = next(lines)
            if not line:
                break

            # Match capability
            for key, matcher in matchers.items():
                groups = matcher.match(line)
                if not groups:
                    continue

                match key:
                    case "StreamType":
                        if "Input" in line:
                            capabilities["input"]["stream_type"].add(groups.group(1))
                        if "Output" in line:
                            capabilities["output"]["stream_type"].add(groups.group(1))
                        break
                    case "CodecID":
                        if "Input" in line:
                            capabilities["input"]["codec_id"].add(groups.group(1))
                        if "Output" in line:
                            capabilities["output"]["codec_id"].add(groups.group(1))
                        break
                    case _:
                        break

        # Convert sets to lists
        for key, value in capabilities.items():
            for k, v in value.items():
                capabilities[key][k] = list(v)

        filters[fname]["capabilities"] = capabilities

    # Get filter links
    iterator = tqdm(filters.keys(), total=len(filters), desc="Links")
    for fname in iterator:
        iterator.set_description(f"Links: {fname:<{longest}}")
        out = gpac(f"-h links {fname}", True)
        lines = out.splitlines()

        if len(lines) < 2:  # FIXME: this is a hack
            continue

        filters[fname]["sources"] = (
            lines[0].split(": ")[1].split(" ") if not "none" in lines[0] else []
        )
        filters[fname]["sinks"] = (
            lines[1].split(": ")[1].split(" ") if not "none" in lines[1] else []
        )

    # Convert to array
    return [{"name": name, **value} for name, value in filters.items()]


if __name__ == "__main__":
    logger.info("Generating data files")

    logger.info("Generating codecs.json")
    codecs = get_codecs()
    logger.success("Generated codecs.json")

    logger.info("Generating filters.json")
    filters = get_filters()
    logger.success("Generated filters.json")

    # Create directory
    os.makedirs("../ui/src/data", exist_ok=True)

    # Save to file
    with open("../ui/src/data/codecs.json", "w") as f:
        json.dump(codecs, f, indent=4)

    with open("../ui/src/data/filters.json", "w") as f:
        json.dump(filters, f, indent=4)

    logger.success("Generated data files")
