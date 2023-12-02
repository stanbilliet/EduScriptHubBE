/*
 * WAARSCHUWING: Deze code is een 'snippet', bedoeld voor demonstratieve doeleinden.
 *              Het bevat geen 'separation of concern' en is uitsluitend bedoeld als inspiratie.
 * BELANGRIJK:   Plaats nooit API-sleutels rechtstreeks in je code. Dit is onveilig en kan leiden tot
 *              beveiligingsrisico's. De tests van deze code zijn ter illustratie tot een minimum beperkt.
 * TIP:          Gebruik deze snippets als uitgangspunt en pas ze aan volgens de best practices en
 *              veiligheidsnormen van je project.
 *
 * GEBRUIK:      Kopieer deze code in een Google App Script bestand.
 *              Dit voorbeeld gebruikt als primaire sleutel de gebruikersnaam.
 *              gebruik je het internnummer als primaire sleutel? Dan zijn er aanpassingen nodig.
 */


/**
 * Functie om een bericht te versturen via Smartschool.
 * Zoekt eerst naar een specifiek bestand in Google Drive, converteert dit naar een bijlage in Base64-formaat,
 * en stuurt vervolgens een SOAP-verzoek naar Smartschool om het bericht met bijlage(n) te versturen.
 */

function sendSmartschoolMessage() {

  // Zoekt naar het bestand 'Brief Digisprong.pdf' en bereidt het voor als bijlage.
  var fileId = findFileIdByName("Brief Digisprong.pdf");
  var attachments = [];
  var documentIds = [fileId];
  for (var i = 0; i < documentIds.length; i++) {
    var file = DriveApp.getFileById(documentIds[i]);
    var blob = file.getBlob();
    var base64String = Utilities.base64Encode(blob.getBytes());
    attachments.push({ filename: file.getName(), filedata: base64String });
  }

  // Serialize attachments to JSON
  var jsonAttachments = JSON.stringify(attachments);


  var apiKey = "UW API KEY HIER"; //Plaats hier uw API KEY
  var userIdentifier = "GEBRUIKERSNAAM.OF.INTERNNUMMER.ONTVANGER"; //Plaats hier de unieke sleutel van de ontvanger
  var title = "Demo01"; //titel van het smartschoolbericht
  var body = "API Demo"; //Inhoud van het smartschoolbericht
  var senderIdentifier = "GEBRUIKERSNAAM.OF.INTERNNUMMER.AFZENDER"; //Plaats hier de unieke sleutel van de afzender
  var coaccount = 0; // Pas aan als het bericht naar een Co-Account moet worden gestuurd
  var copyToLVS = false; // Neem dit bericht op in het LVS


  // Opstellen van een SOAP-verzoek om het bericht te versturen naar Smartschool.

  var xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
    '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ' +
    'xmlns:tns="https://DEMO.smartschool.be:443/Webservices/V3" ' + //pas aan naar je eigen smartschoolplatform
    'xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" ' +
    'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' +
    'xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/" ' +
    'xmlns:soap-enc="http://schemas.xmlsoap.org/soap/encoding/" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    '<SOAP-ENV:Body>' +
    '<mns:sendMsg xmlns:mns="https://DEMO.smartschool.be:443/Webservices/V3" ' + //pas aan naar je eigen smartschoolplatform
    'SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
    '<accesscode xsi:type="xsd:string">' + apiKey + '</accesscode>' +
    '<userIdentifier xsi:type="xsd:string">' + userIdentifier + '</userIdentifier>' +
    '<title xsi:type="xsd:string">' + title + '</title>' +
    '<body xsi:type="xsd:string">' + body + '</body>' +
    '<senderIdentifier xsi:type="xsd:string">' + senderIdentifier + '</senderIdentifier>' +
    '<attachments xsi:type="xsd:string">' + jsonAttachments + '</attachments>' +
    '<coaccount xsi:type="xsd:int">' + coaccount + '</coaccount>' +
    '<copyToLVS xsi:type="xsd:boolean">' + copyToLVS + '</copyToLVS>' +
    '</mns:sendMsg>' +
    '</SOAP-ENV:Body>' +
    '</SOAP-ENV:Envelope>';

  var options = {
    "method": "post",
    "contentType": "text/xml; charset=utf-8",
    "payload": xml,
    "muteHttpExceptions": true
  };

  // Versturen van het opgestelde SOAP-verzoek en loggen van de response.

  var soapCall = UrlFetchApp.fetch("https://demo.smartschool.be/Webservices/V3", options); //pas aan naar je eigen smartschoolplatform
  Logger.log(soapCall);
}


/**
 * Functie om het ID van een bestand te vinden in Google Drive op basis van de bestandsnaam.
 * Geeft het ID van het eerste gevonden bestand terug of null als het bestand niet gevonden wordt.
 *
 * @param {string} filename - De naam van het bestand waarvan het ID opgezocht moet worden.
 * @returns {string|null} Het ID van het gevonden bestand, of null als het bestand niet gevonden wordt.
 */

function findFileIdByName(filename) {

  var files = DriveApp.getFilesByName(filename);
  if (!files.hasNext()) {
    return null;
  }

  var file = files.next();
  return file.getId();

}