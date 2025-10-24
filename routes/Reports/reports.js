const express = require('express');
const router = express.Router();
const ReportService = require('../../services/Reports/reports');
const CouponReportService = require('../../services/Reports/coupon');

router
    .post('/getCount', ReportService.getCount)
    .post('/technicianBelow4Ratings', ReportService.technicianBelow4Ratings)
    .post('/technicianHighRatings', ReportService.techniciaNHighRatings)
    .post('/customerBelow4Ratings', ReportService.customerBelow4Ratings)
    .post('/customerHighRatings', ReportService.customerHighRatings)
    .post('/getEarnings', ReportService.getEarnings)
    .post('/orderPieChart', ReportService.orderPieChart)
    .post('/orderSummaryReport', ReportService.OrderSummaryReport)
    .post('/orderDetailedReport', ReportService.orderDetailedReport)
    .post('/technicianPerformanceReport', ReportService.technicianPerformanceReport)
    .post('/serviceUtilizationReport', ReportService.serviceUtilizationReport)
    .post('/refundReport', ReportService.refundReport)
    .post('/technicianwiseJobCardReport', ReportService.technicianwiseJobCardReport)
    .post('/vendorPerformanceReport', ReportService.vendorPerformanceReport)
    .post('/customerServiceFeedbackReport', ReportService.customerServiceFeedbackReport)
    .post('/customerTechnicianFeedbackReport', ReportService.customerTechnicianFeedbackReport)
    .post('/technicianCustomerFeedbackReport', ReportService.technicianCustomerFeedbackReport)
    .post('/orderCancellationReport', ReportService.orderCancellationReport)
    .post('/customerRegistrationReport', ReportService.customerRegistrationReport)
    .post('/jobAssignmentReport', ReportService.jobAssignmentReport)
    .post('/orderwiseJobCardDetailedReport', ReportService.orderwiseJobCardDetailedReport)
    .post('/emailTransactionHistory', ReportService.emailTransactionHistory)
    .post('/smsTransactionHistory', ReportService.smsTransactionHistory)
    .post('/whatsappTransactionHistory', ReportService.whatsappTransactionHistory)
    .post('/b2bcustomerServicesSummery', ReportService.b2bcustomerServicesSummery)
    .post('/technicianTimeSheet', ReportService.technicianTimeSheet)
    .post('/coupon/detailed/get', CouponReportService.getDetailedReport)
    .post('/coupon/summary/get', CouponReportService.getSummaryReport)
    .post('/getTechnicianEarnings', ReportService.getTechnicianEarnings)
    .post('/couponDetailedReport', CouponReportService.getCustomerDetailedReport)
    .post('/couponSummaryReport', CouponReportService.getCustomerSummaryReport)
    .post('/gettechnicianCashCollection', ReportService.gettechnicianCashCollection)
    .post('/getDistinctOrderNumbers', ReportService.getDistinctOrderNumbers)
    .post('/vendorDetailedPerformanceReport', ReportService.vendorDetailedPerformanceReport)
    .post('/getTechnicianSLAReport', ReportService.getTechnicianSLAReport)
    .post('/getCustomerAddressLogs', ReportService.getCustomerAddressLogs)
    .post('/userloginLogs', ReportService.userloginLogs)






module.exports = router;