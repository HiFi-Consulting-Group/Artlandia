public with sharing class ArtlandiaController {

    @AuraEnabled(cacheable=false)
    public static String createArtReport(String lat, String lng, String comments) {
        Art_Report__c report = new Art_Report__c (
            name = 'Artlandia Submission',
            Location_Coordinates__Latitude__s = Decimal.valueOf(lat),
            Location_Coordinates__Longitude__s = Decimal.valueOf(lng),
            Additional_Comments__c = comments
        );
        insert report;
        return JSON.serialize(report);
    } 

    @AuraEnabled(cacheable=false)
    public static void addPhotoToArtReport(String fileName, String base64Data, String artReportId) {

        if (base64Data==null) {
            return;
        }

        Blob body = EncodingUtil.base64Decode(base64Data);

        ContentVersion cntVersion = new ContentVersion();
        cntVersion.PathOnClient = fileName+'.png';
        cntVersion.Title = fileName;
        cntVersion.VersionData = body;
        insert cntVersion;

        ArtlandiaWithoutSharingController.guesAttachFileToReport(cntVersion.Id, artReportId);

    } 

    @AuraEnabled(cacheable=false)
    public static void addContactDetails(String artReportId, String firstName, String lastName, String email, Boolean joinCommittee) {

        Art_Report__c report = new Art_Report__c (
            First_Name__c = firstName,
            Last_Name__c = lastName,
            Email__c = email,
            Join_the_Committee__c = joinCommittee,
            Id = artReportId
        );

        ArtlandiaWithoutSharingController.guestUpdateReport(report);
    } 

}