/*
 * WAARSCHUWING: Deze code is een 'snippet', bedoeld voor demonstratieve doeleinden.
 *              Het bevat geen 'separation of concern' en is uitsluitend bedoeld als inspiratie.
 * BELANGRIJK:   Plaats nooit API-sleutels rechtstreeks in je code. Dit is onveilig en kan leiden tot
 *              beveiligingsrisico's. De tests van deze code zijn ter illustratie tot een minimum beperkt.
 * TIP:          Gebruik deze snippets als uitgangspunt en pas ze aan volgens de best practices en
 *              veiligheidsnormen van je project.
 *
 * GEBRUIK:      Kopieer deze code in een Google App Script bestand.
 *              Dit voorbeeld gebruikt als primaire sleutel het intern nummer.
 *              gebruik je de gebruikersnaam als primaire sleutel? Dan zijn er aanpassingen nodig.
 */

var accesscode = "YOUR API KEY HERE"; //Plaats hier uw API key


/**
 * Hoofdfunctie die wordt uitgevoerd om de integratie tussen Smartschool en Google G Suite te beheren.
 * Haalt een lijst van alle Smartschool-gebruikers op, maakt van de gebruikersnaam het emailadres, haalt hun foto op en stelt deze in als hun Google-accountfoto.
 */
function mainFunction() {

  var users = listAllUsersFromSmartschool(accesscode, "UNIQUE GROUP ID", 1); //Gebruik 0 om gebruikers uit subgroepen te negeren.


  for (var counter = 0; counter <= users.length; counter = counter + 1) {

    try {

      var email = users[counter].gebruikersnaam + "@DOMAINNAME.SOMETHING"; //vervang dit door uw domeinnaam

      var result = getSmartschoolPhoto(users[counter].internnummer);

      setGoogleAccountPhoto(email, result);

    } catch (ex) {
      console.log(ex);

    }


  }


}

/**
 * Stuurt een SOAP-verzoek naar Smartschool om een lijst van alle gebruikersaccounts op te halen.
 * Verwerkt de SOAP-response en retourneert een lijst van accounts.
 */
function listAllUsersFromSmartschool(accesscode, code, recursive) {

    //opbouwen van de SOAP Envelope
  var xml = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
    'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +
    'xmlns:mns="https://DEMO.smartschool.be/Webservices/V3" ' + // plaats hier uw smartschool domein
    'SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
    '<SOAP-ENV:Body>' +
    '<mns:getAllAccounts>' + 
    '<accesscode xsi:type="xsd:string">' + accesscode + '</accesscode>' +
    '<code xsi:type="xsd:string">' + code + '</code>' +
    '<recursive xsi:type="xsd:string">' + recursive + '</recursive>' +
    '</mns:getAllAccounts>' +
    '</SOAP-ENV:Body>' +
    '</SOAP-ENV:Envelope>';

  var options = {
    "method": "post",
    "contentType": "text/xml; charset=utf-8",
    "payload": xml,
    "muteHttpExceptions": true
  };

  var soapResponse = UrlFetchApp.fetch("https://DEMO.smartschool.be/Webservices/V3", options); // plaats hier uw smartschool domein

  var responseContent = soapResponse.getContentText();

  var decodedXML = extractAndDecodeResponse(responseContent);

  var accounts = parseAccountsXml(decodedXML);

  return accounts;

}
/**
 * Stuurt een SOAP-verzoek naar Smartschool om de foto van een specifieke gebruiker op te halen.
 * Gebruikt het unieke interne nummer van de gebruiker en retourneert de foto in Base64-formaat.
 */
function getSmartschoolPhoto(userIdentifier) {

  var xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
    '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
    'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +
    'xmlns:mns="https://mskakn-sgr25.smartschool.be/Webservices/V3" ' + // Added xmlns:mns here
    'SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
    '<SOAP-ENV:Body>' +
    '<mns:getAccountPhoto>' + // Removed SOAP-ENV:encodingStyle from here
    '<accesscode xsi:type="xsd:string">' + accesscode + '</accesscode>' +
    '<userIdentifier xsi:type="xsd:string">' + userIdentifier + '</userIdentifier>' +
    '</mns:getAccountPhoto>' +
    '</SOAP-ENV:Body>' +
    '</SOAP-ENV:Envelope>';

  var options = {
    "method": "post",
    "contentType": "text/xml; charset=utf-8",
    "payload": xml,
    "muteHttpExceptions": true
  };

  var soapResponse = UrlFetchApp.fetch("https://DEMO/Webservices/V3", options); // plaats hier uw smartschool domein

  var responseContent = soapResponse.getContentText();

  var base64Response = extractStringFromSmartschoolPhotoResponse(responseContent);

  return base64Response;

}

/**
 * Hulpmethode om de fotostring uit het XML-antwoord van Smartschool te extraheren.
 * Verwerkt het XML en retourneert de Base64-gecodeerde fotostring.
 */
function extractStringFromSmartschoolPhotoResponse(responseXml) {
  // Parse the XML response
  var xmlDocument = XmlService.parse(responseXml);
  var root = xmlDocument.getRootElement();
  var body = root.getChildren()[0]; 
  var response = body.getChildren()[0]; 
  var returnValue = response.getChildren('return')[0]; 

  var extractedString = returnValue.getText();
  return extractedString;
}

/**
 * Probeert de Google-accountfoto van een gebruiker in te stellen met de opgegeven Base64-gecodeerde foto.
 * Als de foto niet beschikbaar is, wordt dit gelogd en wordt geen actie ondernomen.
 */
function setGoogleAccountPhoto(userEmail, base64Photo) {
  var photoBlob = Utilities.newBlob(Utilities.base64Decode(base64Photo), 'image/jpeg');
  if (base64Photo != "12") {
    try {
      AdminDirectory.Users.Photos.update({ photoData: base64Photo }, userEmail);

      console.log(userEmail + " picture set");
    } catch (err) {
      Logger.log(err.toString());
    }
  } else {
    console.log(userEmail + " has no picture");
  }
}

/**
 * Hulpmethode om de Base64-gecodeerde respons van Smartschool te decoderen en te verwerken.
 * Converteert de Base64-string terug naar een normale XML-string.
 */

function extractAndDecodeResponse(responseXml) {
  var xmlDocument = XmlService.parse(responseXml);
  var root = xmlDocument.getRootElement();
  var body = root.getChildren()[0];
  var response = body.getChildren()[0];
  var returnValue = response.getChildren('return')[0];

  var base64Encoded = returnValue.getText();
  var decodedXml = Utilities.newBlob(Utilities.base64Decode(base64Encoded)).getDataAsString();

  return decodedXml;
}

/**
 * Analyseert de gedecodeerde XML die de accountsinformatie van Smartschool bevat.
 * Haalt relevante details uit zoals internnummer en gebruikersnaam van elk account en retourneert een lijst met deze gegevens.
 */
function parseAccountsXml(decodedXml) {
  var xmlDocument = XmlService.parse(decodedXml);
  var accountsElement = xmlDocument.getRootElement();
  var accountElements = accountsElement.getChildren('account');

  var accountsInfo = [];

  accountElements.forEach(function (account) {
    var internnummer = account.getChildText('internnummer');
    var gebruikersnaam = account.getChildText('gebruikersnaam');
    //Voeg meer toe indien nodig. Zie documentatie van Smartschool
    accountsInfo.push({ internalNumber: internnummer, userName: gebruikersnaam });
  });

  return accountsInfo;
}