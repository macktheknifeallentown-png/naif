# Set up your private Daisy Sounds classroom

The game and Firebase configuration are built. **Nothing has been deployed,
no paid services have been enabled, and no real student names are included.**
You do not need to send student names or passwords in this chat.

## 1. Try the fictional classroom first

Open `preview/index.html` from GitHub using **Download raw file**, then open
the saved file in Chrome. Choose **Let’s play**, enter **FLOWER22**, and tap a
daisy. There are 22 fictional students. Alanoud, Sarah, and Yara each appear
twice with fictional family names; other children see their first names.

Use **Teacher → Try the fictional dashboard** to see My Students, edit or
remove a name, and try Add Students. This is a **public demonstration**, not
your private login. All demo changes disappear when the page reloads. Use
fictional names only. The downloaded demo does not save across devices.

## 2. Create a free Firebase project

Visit [Firebase Console](https://console.firebase.google.com/) and choose
**Create a project**. Give it a name such as “Daisy Sounds Classroom”. Keep
the free **Spark** plan for now. Google Analytics is not needed for this game.
Do not add a billing account or upgrade the plan yet.

Keep the project ID. That is safe to share with your technical helper; your
password, service-account key, student list, and classroom code are not.

## 3. Turn on teacher and student sign-in

In **Build → Authentication → Get started → Sign-in method**, enable:

- **Email/Password** for your teacher account.
- **Anonymous** for children, so they do not need email accounts or passwords.

Under **Users → Add user**, create your teacher account using your own email
and a strong, unique password. Never put the password in GitHub or in this chat.
Copy the account's **User UID** for the next step. The application has no public
teacher sign-up screen. Creating any other Firebase user does not grant teacher
access: an administrator must explicitly approve the UID below.

## 4. Create the private database and approve yourself

In **Build → Firestore Database → Create database**, choose **production mode**,
not test mode. Choose **Standard edition** and a location approved by your
school. The prepared Functions region is `us-central1`; your helper should
change the backend region and client region together before deployment if the
school needs another region. Database location is difficult to change later.

In the Data tab, create a collection named **teachers**. Add a document whose
document ID is your teacher **User UID**. Add the field **enabled**, select the
**boolean** type, and set it to **true**. Do this only in Firebase Console as
the project owner. The website cannot grant itself teacher status.

The checked-in `firestore.rules` must be deployed before any real roster is
added. They deny all client writes, deny all student reads of saved records,
and allow a verified, approved teacher to read only their own classroom.
Keep the initial production-mode deny rules until those rules are deployed.

## 5. Register the website and prepare App Check

In **Project settings → General → Your apps**, add a **Web app**. Copy its web
configuration to your helper. The project ID, app ID, auth domain, and Firebase
web API key are public app configuration, not a teacher password. They alone
must never grant database access. Server rules and authorization provide that.

Your helper stores this configuration in the ignored **`.env.local`** file,
using `.env.example` as a guide, and sets the app mode to `firebase`.
No student names or classroom codes belong in environment files.

In **App Check**, register the web app with **reCAPTCHA v3**. Include your
Firebase Hosting domain in its allowed domains. Supply its public site key
to your helper. Production callable functions require valid App Check tokens.
Do not use emulator settings or App Check debug tokens on the published site.

In **Authentication → Settings → Authorized domains**, ensure your actual
Hosting domain is present. Use a separate browser tab for the teacher dashboard.
Your first teacher sign-in can send a verification email. Open that email,
verify the address, and sign in again. Unverified accounts cannot use the
dashboard even when their UID is approved.

## 6. Stop before billing or deployment

**This design uses Cloud Functions as the trusted server for access codes,
roster changes, and scoring. Deploying Cloud Functions requires Firebase's
Blaze billing plan.** The free demo/emulators need no billing. A free-only
Hosting page cannot safely replace these server checks by hiding names in
JavaScript or weakening the Firestore rules.

Your helper must ask for your approval before linking billing, enabling paid
services, or deploying the backend. No deployment was performed for this task.
Firebase's no-cost allowances can reduce charges, but they do not guarantee
a zero bill. Budget alerts warn about spending; they are not a spending cap.
The prepared backend limits running instances, but that also is not a cost cap.

Once you approve the hosting plan, your helper can deploy the access rules,
indexes, Functions, and Hosting configuration in this repository. Deployment
builds stop if production configuration is missing or emulator mode is on.
The Hosting folder contains only the compiled website; it does not publish
the Functions source, environment files, teacher grants, or database contents.

## 7. Check the private site with fictional students

Your helper should supply your actual HTTPS Hosting address after deployment,
not a localhost link. Before you enter real names, check all of these:

1. Sign out: the Teacher button asks for email and password.
2. An unapproved or unverified account cannot see My Students.
3. Sign in as your approved teacher and choose **Create classroom code**.
4. Copy the code privately. The full code is shown once; you can replace it
   with **Change classroom code**. A replacement ends old student sessions.
5. Choose **Add Students**, then use **Fill with 22 fictional names** and
   **Preview names → Save students**.
6. On another device, open the Hosting address, enter the code, choose a
   fictional name, and finish the game.
7. Return to the dashboard and choose **Refresh progress**. Check the completion
   date, first-try score, attempts, and words needing practice.
8. Sign in as the teacher on a second device and check the same result.
9. Confirm that students cannot open saved scores, other students' records,
   roster documents, or teacher-only tools through Firestore or callable APIs.
10. Remove a fictional student and check that its progress is deleted and its
    active session cannot continue. Changing a name must keep its existing ID
    and progress.

Local emulator tests already exercise these access boundaries. The production
HTTPS site and App Check still need this final check after deployment.

## 8. Add your real class privately, after the checks pass

Only then, remove the fictional roster and choose **Add Students** inside
your signed-in dashboard. Paste one full name per line, or import a small
`.txt` or `.csv` file with **firstName,familyName** columns. Preview before
saving. Maximum: **22 students**. Do not upload the roster to GitHub, Classera
attachments, this chat, or the public website's source files.

Children see only first names, except that repeated first names show the
family name too. Supply family names for every repeated first name. Exact
duplicate full names must be distinguished with an additional family/middle
name before saving. Editing preserves the student's record ID; removing a
student permanently deletes its saved runs and removes the name from the
picker. Firestore backup/retention policies, if your school later enables
them, are managed separately in Firebase Console.

The dashboard shows the latest 25 games per student, with dates in the
viewing device's time zone. Older runs remain in Firestore. A first-try score
counts words answered correctly on the first attempt without a hint. Daisies
reward all six words after practice; a hint or wrong answer puts that word in
the practice list. An abandoned game is shown as in progress.

## 9. Share the game through Classera

After the fictional production test passes and the school approves, put the
**student HTTPS game link** in Classera. Share the classroom code only within
the class. Do not share your teacher password. Opening as an external link
is the supported first choice; a Classera embedded frame may block speech or
Firebase Authentication. Test Listen on the children's actual devices.

## What the name picker does and does not prove

The code protects access to the name list, and students cannot read saved
scores, even after choosing another child's name. However, a shared code and
a name button cannot prove a child's identity: someone with the code could
choose the wrong name and create a misattributed attempt. Use teacher
supervision. Individual student PINs or school-managed identities would be
needed for stronger identity assurance.

Teacher sessions use memory-only authentication and end when the page reloads.
Sign out on shared devices. Use **Change student** between children. Child
sessions expire after four hours and end when the page reloads; entering the
code again does not expose previous scores. Only the teacher can see history.
Student names/progress are never cached in localStorage or in a service worker.
