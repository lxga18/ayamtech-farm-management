const express = require('express');
const router = express.Router();

const {
    getDriverDashboard,
    getDriverDeliveries,
    getDriverDeliveriesPageData,
    getDriverDeliveryDetails,
    updateDeliveryStatus,
    updateDriverDeliveryRemarks,
    getDriverProfile,
    updateDriverProfile,
    changeDriverPassword
} = require('../controllers/driverController');

const { protect } = require('../middleware/authMiddleware');
const { verifyDriver } = require('../middleware/roleMiddleware');

// Apply auth and driver role middleware to all driver routes
router.use(protect);
router.use(verifyDriver);

// ------------------- DASHBOARD -------------------
router.get('/dashboard', getDriverDashboard);
router.get('/deliveries/page-data', getDriverDeliveriesPageData);
// ------------------- DELIVERIES -------------------
router.get('/deliveries', getDriverDeliveries);
router.get('/deliveries/:delivery_id', getDriverDeliveryDetails);
router.patch('/deliveries/:delivery_id/status', updateDeliveryStatus);
router.patch('/deliveries/:delivery_id/remarks', updateDriverDeliveryRemarks);

// ------------------- PROFILE -------------------
router.get('/profile', getDriverProfile);
router.patch('/profile', updateDriverProfile);
router.patch('/profile/change-password', changeDriverPassword);

module.exports = router;