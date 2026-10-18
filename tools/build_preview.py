"""Bundle the original game into a self-contained preview and optional downloads."""

from argparse import ArgumentParser
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--download-dir', type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    html = (root / 'index.html').read_text()
    css = (root / 'styles.css').read_text()
    js = (root / 'game.js').read_text()
    style_tag = '<link rel="stylesheet" href="styles.css">'
    script_tag = '<script src="game.js" defer></script>'
    assert html.count(style_tag) == html.count(script_tag) == 1
    assert '</style' not in css.lower() and '</script' not in js.lower()
    html = html.replace(style_tag, '<style>\n' + css + '\n</style>')
    html = html.replace(script_tag, '')
    html = html.replace('</body>', '<script>\n' + js + '\n</script>\n</body>')
    preview = root / 'preview' / 'index.html'
    preview.parent.mkdir(exist_ok=True)
    preview.write_text(html)
    print('Built preview/index.html (all styles, scripts, and pictures included).')
    if args.download_dir:
        output = args.download_dir
        output.mkdir(parents=True, exist_ok=True)
        (output / 'index.html').write_text(html)
        instructions = (
            'DAISY SOUNDS — OPEN AND PLAY\n\n'
            '1. Extract this ZIP: right-click > Extract All on Windows, or double-click on Mac.\n'
            '2. Find index.html in the extracted Daisy-Sounds folder.\n'
            '3. Right-click index.html > Open with > Google Chrome.\n'
            '4. Press Let’s play!\n\n'
            'No installation, server, or programming is needed.\n'
            'If you downloaded index.html on its own, just open that file in Chrome.\n'
            'All colors, buttons, pictures, and game code are inside this one file.\n\n'
            'Listen uses the English speech voice on your device. Turn up the volume.\n'
            'Some voices need an internet connection. If audio is blocked, the game\n'
            'still works with pictures, hints, and answer buttons.\n\n'
            'The source folder contains the original HTML, CSS, and JavaScript.\n'
            'Do not open source/index.html on its own without the other source files.\n'
            'No student names, accounts, tracking, or score uploads are included.\n'
        )
        (output / 'OPEN-ME-FIRST.txt').write_text(instructions)
        with ZipFile(output / 'Daisy-Sounds.zip', 'w', ZIP_DEFLATED) as archive:
            archive.writestr('Daisy-Sounds/index.html', html)
            archive.writestr('Daisy-Sounds/OPEN-ME-FIRST.txt', instructions)
            for name in ['index.html', 'styles.css', 'game.js']:
                archive.write(root / name, 'Daisy-Sounds/source/' + name)
        print('Created index.html and Daisy-Sounds.zip downloads.')


if __name__ == '__main__':
    main()
