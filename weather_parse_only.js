// ============================================================
// SMS Weather Auto-Responder — Response Parser Only
// Use with Tasker's native HTTP Request action
// ============================================================
// This script ONLY parses the NAIPS SOAP response.
// The HTTP call is done by Tasker's HTTP Request action,
// which stores the response in %http_data.
// ============================================================

var resp = http_data.toString();
var valid = 0;
var reply = "";

if (resp.indexOf('status="SUCCESS"') !== -1) {
    // Extract <content>...</content> from SOAP response
    var cm = resp.match(/<content[^>]*>([\s\S]*?)<\/content>/);
    var content = cm ? cm[1] : "";

    // Decode XML entities
    content = content.replace(/&lt;/g, "<")
                     .replace(/&gt;/g, ">")
                     .replace(/&amp;/g, "&");

    // Extract METAR
    var metar = "";
    var mm = content.match(/((?:METAR|SPECI)\s+[A-Z]{4}\s+\d{6}Z[^\n]*)/);
    if (mm) { metar = mm[1].trim(); }

    // Extract TAF (multi-line)
    var taf = "";
    var tm = content.match(/(TAF(?:\s+AMD)?\s+[A-Z]{4}\s+\d{6}Z[\s\S]*?)(?=\n\s*\n|\nMETAR|\nSPECI|\nATIS|\nNOTAM|$)/);
    if (tm) { taf = tm[1].trim(); }

    // Build reply
    if (metar.length > 0 || taf.length > 0) {
        valid = 1;
        reply = "=== " + icao + " ===\n\n";
        reply += (metar.length > 0) ? "METAR:\n" + metar + "\n\n" : "METAR: N/A\n\n";
        reply += (taf.length > 0) ? "TAF:\n" + taf : "TAF: N/A";
    }

} else if (resp.indexOf("ACCESS_VIOLATION") !== -1) {
    valid = 1;
    reply = "NAIPS login failed. Check credentials.";
}

// Pass results back to Tasker
setLocal("reply", reply);
setLocal("valid", valid.toString());
