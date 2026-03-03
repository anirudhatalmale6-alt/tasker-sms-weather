// ============================================================
// SMS Weather Auto-Responder — NAIPS Version (Alternative)
// Source: Airservices Australia NAIPS (requires login)
// ============================================================
// NOTE: This version requires your NAIPS credentials.
//       It is more fragile than the aviationweather.gov version
//       because it depends on session cookies and HTML scraping.
//       Use this only if you specifically need NAIPS as the source.
// ============================================================
// IMPORTANT: Set your credentials below before using.
// ============================================================

// --- YOUR NAIPS CREDENTIALS ---
var NAIPS_USER = "YOUR_USERNAME_HERE";
var NAIPS_PASS = "YOUR_PASSWORD_HERE";

// --- Read SMS body from Tasker variable ---
var body = sms_body.toString().trim().toUpperCase();

// --- Extract ICAO code ---
var icao = "";
var match = body.match(/\b([A-Z]{4})\b/);
if (match) {
    icao = match[1];
}

var valid = 0;
var reply = "";

if (icao.length === 4) {

    try {
        // Step 1: GET login page to establish session cookies
        var xhr0 = new XMLHttpRequest();
        xhr0.open("GET", "https://www.airservicesaustralia.com/naips/Account/Logon", false);
        xhr0.send();

        // Step 2: POST login credentials
        // The browser/Tasker HTTP engine should carry cookies automatically
        var xhr1 = new XMLHttpRequest();
        xhr1.open("POST", "https://www.airservicesaustralia.com/naips/Account/LogOn", false);
        xhr1.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr1.send("UserName=" + encodeURIComponent(NAIPS_USER) +
                  "&Password=" + encodeURIComponent(NAIPS_PASS));

        // Step 3: Fetch Location Briefing for the ICAO code
        // NOTE: The exact briefing URL may need adjustment.
        // After login, NAIPS provides briefing at this endpoint.
        // You may need to inspect the actual NAIPS site flow with your
        // credentials to confirm the correct URL and parameters.
        var briefUrl = "https://www.airservicesaustralia.com/naips/Briefing/LocationBriefing" +
                       "?location=" + icao;
        var xhr2 = new XMLHttpRequest();
        xhr2.open("GET", briefUrl, false);
        xhr2.send();

        var html = xhr2.responseText;

        // Step 4: Parse METAR and TAF from the response
        // The response is HTML. Look for METAR and TAF sections.
        var metar = "";
        var taf = "";

        // Try to extract METAR (look for "METAR" followed by the report)
        var metarMatch = html.match(/METAR\s+[A-Z]{4}\s+\d{6}Z[\s\S]*?(?=TAF|$)/);
        if (metarMatch) {
            metar = metarMatch[0].trim();
        }

        // Try to extract TAF
        var tafMatch = html.match(/TAF(?:\s+AMD)?\s+[A-Z]{4}\s+\d{6}Z[\s\S]*?(?=<|$)/);
        if (tafMatch) {
            taf = tafMatch[0].trim();
            // Clean HTML tags if any
            taf = taf.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        }

        if (metar.length > 0 || taf.length > 0) {
            valid = 1;
            reply = "=== " + icao + " (NAIPS) ===\n\n";

            if (metar.length > 0) {
                reply += "METAR:\n" + metar + "\n\n";
            } else {
                reply += "METAR: N/A\n\n";
            }

            if (taf.length > 0) {
                reply += "TAF:\n" + taf;
            } else {
                reply += "TAF: N/A";
            }
        }

    } catch (e) {
        // Login or fetch failed — no reply will be sent
        // flash("NAIPS error: " + e.message);  // uncomment to debug
    }
}

// --- Pass results back to Tasker ---
setLocal("reply", reply);
setLocal("valid", valid.toString());
