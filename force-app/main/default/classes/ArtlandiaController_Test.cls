@isTest
public class ArtlandiaController_Test {
    
    @isTest
    static void createArtReport_PositiveTest() {
        
        //call ArtlandiaController.createArtReport to insert new Litter Report
        //verify that the inserted record reads as expected
        String lat      = '55.9398';
        String lng      = '-3.1572';
        String comments = 'trashy hill';
        
        Test.startTest();
        ArtlandiaController.createArtReport(lat, lng, comments);
        Test.stopTest();
        
        Art_Report__c insertedReport = [SELECT Id, Location_Coordinates__latitude__s, Location_Coordinates__longitude__s  FROM Art_Report__c WHERE Additional_Comments__c = :comments];
        
        System.assertEquals(lat, String.valueOf(insertedReport.Location_Coordinates__latitude__s), 'Inserted Litter Report latitude not populating correctly');
        System.assertEquals(lng, String.valueOf(insertedReport.Location_Coordinates__longitude__s), 'Inserted Litter Report longitude not populating correctly');        
    }
    
    @isTest
    static void addPhotoToArtReport_PositiveTest(){
        
        //call ArtlandiaController.addPhotoToArtReport to add photo data to a test Litter Report record
        //verify that a ContentVersion with correct data is inserted
        //also verify that a ContentDocumentLink is inserted and correctly links the Litter Report and the ContentVersion   
        String lat      = '55.9398';
        String lng      = '-3.1572';
        String comments = 'trashy hill';
        
        ArtlandiaController.createArtReport(lat, lng, comments);
        Art_Report__c insertedReport = [SELECT Id FROM Art_Report__c WHERE Additional_Comments__c = :comments];
        
        String fileName       = 'litter';
        String siteReportId   = insertedReport.Id;
        String base64Data     = 'TWFuIGlzIGRpc3Rpbmd1aXNoZWQsIG5vdCBvbmx5IGJ5IGhpcyByZWFzb24sIGJ1dCAuLi4';
             
        Test.startTest();
        ArtlandiaController.addPhotoToArtReport(fileName, base64Data, siteReportId);
        Test.stopTest();
        
        //tests for both ArtlandiaController.addPhotoToArtReport and SolveItWithoutSharingController.attachFileToReport
        ContentVersion insertedCntVersion = [SELECT Id, PathOnClient, ContentDocumentId FROM ContentVersion WHERE Title = :fileName];        
        ContentDocumentLink insertedCDL   = [SELECT Id, ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :insertedReport.Id];
        
        System.assertEquals('litter.png', insertedCntVersion.PathOnClient, 'Inserted ContentVersion data not populated correctly');
        System.assertEquals(insertedCntVersion.ContentDocumentId, insertedCDL.ContentDocumentId, 'ContentDocumentId on ContentVersion and ContentDOcumentLink do not match');  
    }    
    
    @isTest
    static void addPhotoToArtReport_NegativeTest(){
        
        //call ArtlandiaController.addPhotoToArtReport to with null base64 data
        //verify that no ContentVersions are inserted
        String lat      = '55.9398';
        String lng      = '-3.1572';
        String comments = 'trashy hill';
        
        ArtlandiaController.createArtReport(lat, lng, comments);
        Art_Report__c insertedReport = [SELECT Id FROM Art_Report__c WHERE Additional_Comments__c = :comments];
        
        String fileName       = 'litter';
        String siteReportId   = insertedReport.Id;
        
        Test.startTest();
        ArtlandiaController.addPhotoToArtReport(fileName, null, siteReportId);
        Test.stopTest(); 
        
        List <ContentVersion> insertedCntVersion = [SELECT Id FROM ContentVersion];
        
        System.assertEquals(true, insertedCntVersion.IsEmpty(), 'ContentVersion record being inserted with null base64 data');
    }
    
    @isTest
    static void addContactDetails_PositiveTest(){
        
        //call ArtlandiaController.addContactDetails to add contact data to existing Litter Report
        //verify that existing Litter Report is accurately updated
        String lat      = '55.9398';
        String lng      = '-3.1572';
        String comments = 'trashy hill';
        
        ArtlandiaController.createArtReport(lat, lng, comments);
        Art_Report__c insertedReport = [SELECT Id FROM Art_Report__c WHERE Additional_Comments__c = :comments];
        
        String firstName = 'Littered';
        String lastName  = 'Knoll';
        String email     = 'test@email.com';
        
		Test.startTest();        
        ArtlandiaController.addContactDetails(insertedReport.Id, firstName, lastName, email, true);
        Test.stopTest();
        
		Art_Report__c updatedReport = [SELECT Id, First_Name__c, Last_Name__c, Email__c, Join_the_Committee__c FROM Art_Report__c WHERE Id = :insertedReport.Id]; 
        
        System.assertEquals(firstName, updatedReport.First_Name__c, 'Contact fields on Litter Report not updating correctly');
        System.assertEquals(lastName, updatedReport.Last_Name__c, 'Contact fields on Litter Report not updating correctly');
        System.assertEquals(email, updatedReport.Email__c, 'Contact fields on Litter Report not updating correctly');
        System.assertEquals(true, updatedReport.Join_the_Committee__c, 'Contact fields on Litter Report not updating correctly');
    }
}