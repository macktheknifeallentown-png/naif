# Grade 1 Phonics Games

This project contains fun, interactive English learning games for Grade 1 students.

## Daisy Sounds

A gentle phonics game for **rich, such, catch, patch**, plus the sentence words
**lunch** and **bench**. Children listen to one word at a time and choose **ch** or
**tch**, or type the ending. Pictures, a word hint, spoken feedback, and unlimited
retries help them work independently. Every completed word earns a daisy.

The game finishes with “I have lunch on the bench.” and a celebration garden.
Both **ch** and **tch** can make the same sound; the activity practices which
spelling belongs in each word. The cake illustrates “Such a big cake!”

## Open the game

No installation or programming is needed. The completed game is saved here on GitHub.

1. Open **[the single-file game](preview/index.html)** on GitHub.
2. Click **Download raw file** (the down-arrow button near the top of the file).
3. Find `index.html` in your Downloads folder. Right-click it and choose **Open with → Google Chrome**.
4. Press **Let’s play**.

The single-file game includes every color, picture, and game button. You do not
need to download any other files. GitHub's file page shows the code; download
the file and open it in Chrome to play.

Alternatively, choose **Code → Download ZIP** on the repository's main file
listing, extract the ZIP, and open `preview/index.html`. The original
`index.html`, `styles.css`, and `game.js` are also preserved in this repository.
Keep those three original files together if you open the original `index.html` instead.

Use **Listen** to hear the word again, and **Show me the word** for help.
The **Type** tab lets children use the keyboard instead.

The cloud server's localhost address is not a public preview: opening it on
your own computer cannot reach the cloud server. Use the download until a
forwarded preview or online hosting is available.

## Preview files

The main project keeps its original three files: `index.html`, `styles.css`,
and `game.js`. The additional **`preview/index.html`** includes all the CSS,
JavaScript, and picture drawings inside one file. Use that file for an HTML
visualization that cannot load neighboring files. It makes no requests for
styles, scripts, fonts, or images. `tools/build_preview.py` regenerates it from
the original files and can also package downloads.

The Codex visualization itself may restrict JavaScript or audio. If it shows
an error, download the self-contained file and open it in Chrome rather than
trying to play inside the visualization.

Sound uses the browser's built-in English text-to-speech. Available voices
depend on the browser and device; some need an internet connection. Turn up
the volume. If sound is unavailable, the game shows a help message and the
picture, text, and answer controls still work. All drawings and game files
are included locally; there are no external fonts, images, ads, accounts,
or data collection. Progress lasts for the current game only. No student
names are included; use fictional names only until secure hosting is set up.

For classroom use, check the Listen button on each device before independent
practice. Keyboard users can Tab through the controls and press Enter or Space.
