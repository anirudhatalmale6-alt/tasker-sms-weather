// ============================================================
// SMS Weather Auto-Responder — NAIPS SOAP Version
// Source: Airservices Australia NAIPS Briefing Service
// ============================================================
// SETUP: Enter your NAIPS credentials below.
//        Username MUST be UPPERCASE.
// ============================================================

// --- YOUR NAIPS CREDENTIALS ---
var NAIPS_USER = "YOUR_USERNAME_HERE";   // UPPERCASE only
var NAIPS_PASS = "YOUR_PASSWORD_HERE";   // 7-20 alphanumeric

// --- Read SMS body from Tasker variable ---
var body = sms_body.toString().trim().toUpperCase();

// --- Extract 4-letter ICAO code ---
var icao = "";
var match = body.match(/\b([A-Z]{4})\b/);
if (match) { icao = match[1]; }

var valid = 0;
var reply = "";

if (icao.length === 4) {

    // Build SOAP request XML
    var soapXml = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<SOAP-ENV:Envelope' +
        ' xmlns:ns0="http://schemas.xmlsoap.org/soap/envelope/"' +
        ' xmlns:ns1="http://www.airservicesaustralia.com/naips/xsd"' +
        ' xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">' +
        '<SOAP-ENV:Header/>' +
        '<ns0:Body>' +
        '<ns1:loc-brief-rqs' +
        ' password="' + NAIPS_PASS + '"' +
        ' requestor="' + NAIPS_USER + '"' +
        ' source="sms-wx">' +
        '<ns1:loc>' + icao + '</ns1:loc>' +
        '<ns1:flags met="true"/>' +
        '</ns1:loc-brief-rqs>' +
        '</ns0:Body>' +
        '</SOAP-ENV:Envelope>';

    // POST to NAIPS SOAP endpoint
    var xhr = new XMLHttpRequest();
    xhr.open("POST",
        "https://www.airservicesaustralia.com/naips/briefing-service",
        false);
    xhr.setRequestHeader("Content-Type", 'text/xml;charset="utf-8"');
    xhr.setRequestHeader("SOAPAction",
        "https://www.airservicesaustralia.com/naips/briefing-service?wsdl");
    xhr.send(soapXml);

    if (xhr.status === 200) {
        var resp = xhr.responseText;

        // Check for SUCCESS status
        if (resp.indexOf('status="SUCCESS"') !== -1) {

            // Extract <content>...</content> from SOAP response
            var contentMatch = resp.match(/<content[^>]*>([\s\S]*?)<\/content>/);
            var content = contentMatch ? contentMatch[1] : "";

            // Decode XML entities
            content = content.replace(/&lt;/g, "<")
                             .replace(/&gt;/g, ">")
                             .replace(/&amp;/g, "&")
                             .replace(/&quot;/g, '"')
                             .replace(/&apos;/g, "'");

            // Extract METAR — look for line starting with "METAR" or "SPECI"
            var metar = "";
            var metarMatch = content.match(/((?:METAR|SPECI)\s+[A-Z]{4}\s+\d{6}Z[^\n]*)/);
            if (metarMatch) {
                metar = metarMatch[1].trim();
            }

            // Extract TAF — starts with "TAF" and continues with
            // continuation lines (BECMG, TEMPO, FM, etc.)
            var taf = "";
            var tafMatch = content.match(/(TAF(?:\s+AMD)?\s+[A-Z]{4}\s+\d{6}Z[\s\S]*?)(?=\n\s*\n|\nMETAR|\nSPECI|\nATIS|\nNOTAM|$)/);
            if (tafMatch) {
                taf = tafMatch[1].trim();
            }

            // Build reply if we got data
            if (metar.length > 0 || taf.length > 0) {
                valid = 1;
                reply = "=== " + icao + " ===\n\n";
                reply += (metar.length > 0) ? "METAR:\n" + metar + "\n\n" : "METAR: N/A\n\n";
                reply += (taf.length > 0) ? "TAF:\n" + taf : "TAF: N/A";
            }

        } else if (resp.indexOf("ACCESS_VIOLATION") !== -1 ||
                   resp.indexOf("INVALID_ACCOUNT") !== -1) {
            // Bad credentials — send error reply so user knows
            valid = 1;
            reply = "NAIPS login failed. Check your credentials in the Tasker script.";
        }
        // If status is other error or no data, valid stays 0 → no reply
    }
}

// --- Pass results back to Tasker ---
setLocal("reply", reply);
setLocal("valid", valid.toString());
