public without sharing class ArtlandiaWithoutSharingController {
    
    @future
    public static void guesAttachFileToReport(ID contentVersionId, ID siteReportId) {   
        //Fetch the ContentDocumentID
		ContentVersion insertedVer = [SELECT ID, ContentDocumentId FROM ContentVersion WHERE ID=:contentVersionId];

		//Move document into the folder
		ContentDocumentLink cdl = new ContentDocumentLink();
		cdl.ContentDocumentId = insertedVer.ContentDocumentId;
		cdl.ShareType = 'I';
		cdl.Visibility = 'AllUsers';
		cdl.LinkedEntityId = siteReportId; //Magic happens here

        insert cdl;

    }

    public static void guestUpdateReport(Art_Report__c report) {
        update report;
    }
}