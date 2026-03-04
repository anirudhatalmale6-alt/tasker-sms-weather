// ============================================================
// SMS Weather Auto-Responder — JavaScriptlet
// Source: aviationweather.gov (free, no auth required)
// ============================================================
// This script runs inside Tasker's JavaScriptlet action.
// It reads the SMS body, extracts the ICAO code, fetches
// METAR and TAF, then sets %reply and %valid for Tasker.
// ============================================================

// --- Read SMS body from Tasker variable ---
var body = sms_body.toString().trim().toUpperCase();

// --- Extract ICAO code ---
// Supports bare code "YSSY", or prefixed "WX YSSY", "METAR YSSY", etc.
var icao = "";
var match = body.match(/\b([A-Z]{4})\b/);
if (match) {
    icao = match[1];
}

// --- Validate: must be exactly 4 uppercase letters ---
var valid = 0;
var reply = "";

if (icao.length === 4) {

    // Fetch METAR
    var metarUrl = "https://aviationweather.gov/api/data/metar?ids=" + icao + "&format=raw";
    var xhr1 = new XMLHttpRequest();
    xhr1.open("GET", metarUrl, false);  // synchronous
    xhr1.send();
    var metar = (xhr1.status === 200) ? xhr1.responseText.trim() : "";

    // Fetch TAF
    var tafUrl = "https://aviationweather.gov/api/data/taf?ids=" + icao + "&format=raw";
    var xhr2 = new XMLHttpRequest();
    xhr2.open("GET", tafUrl, false);  // synchronous
    xhr2.send();
    var taf = (xhr2.status === 200) ? xhr2.responseText.trim() : "";

    // Build reply only if we got at least one piece of data
    if (metar.length > 0 || taf.length > 0) {
        valid = 1;
        reply = "=== " + icao + " ===\n\n";

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
    // If both are empty, valid stays 0 → no reply sent
}

// --- Pass results back to Tasker ---
setLocal("reply", reply);
setLocal("valid", valid.toString());
