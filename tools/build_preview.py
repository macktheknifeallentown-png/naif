"""Build the fictional single-file preview and optional beginner downloads."""
from argparse import ArgumentParser
from pathlib import Path
from subprocess import run
from zipfile import ZIP_DEFLATED, ZipFile

parser = ArgumentParser(description=__doc__)
parser.add_argument('--download-dir', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
run(['node', str(root / 'tools/build-demo.js')], cwd=root, check=True)
if args.download_dir:
    output = args.download_dir
    output.mkdir(parents=True, exist_ok=True)
    html = (root / 'preview/index.html').read_bytes()
    (output / 'index.html').write_bytes(html)
    instructions = ('DAISY SOUNDS — FICTIONAL DEMO ONLY\n\n'
                    'Extract the ZIP, then open index.html in Google Chrome.\n'
                    'Press Let’s play, enter FLOWER22, and choose a fictional daisy.\n'
                    'Teacher opens a PUBLIC demo dashboard, not a private login.\n'
                    'All edits and progress disappear when you reload this demo.\n'
                    'Use fictional names only. Secure online saving needs the Firebase setup.\n')
    with ZipFile(output / 'Daisy-Sounds.zip', 'w', ZIP_DEFLATED) as archive:
        archive.writestr('Daisy-Sounds/index.html', html)
        archive.writestr('Daisy-Sounds/OPEN-ME-FIRST.txt', instructions)
