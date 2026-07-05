const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
    getTasks,
    updateTask,

    getFeed,
    addFeed,
    getFeedPageData,
    getRecentFeedRecords,

    getMedications,
    addMedication,
    getMedicationPageData,
    getRecentMedicationRecords,

    getMortality,
    addMortality,
    getMortalityPageData,
    getRecentMortalityRecords,
    getMortalityCauseSummary,

    getBatches,
    getTodaySummary,
    getAlerts,
    getBatchStatus,

    getAllBatches,
    getBatchDetails,
    getWorkerPerformance,
    getWorkerProfile,
    updateWorkerProfile,
    changeWorkerPassword,

    getPickupOrders,
    markPickupReady,
    confirmPickupCollected
} = require('../controllers/workerController');

const { protect } = require('../middleware/authMiddleware');
const { verifyWorker } = require('../middleware/roleMiddleware');

// ------------------- MULTER UPLOAD SETUP -------------------

const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const medicationStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        // Short filename because medication_photo is varchar(25)
        // Example: mabc123.png
        const shortId = Math.random().toString(36).substring(2, 8);
        cb(null, `m${shortId}${ext}`);
    }
});

const medicationUpload = multer({
    storage: medicationStorage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only JPG, PNG, and WEBP images are allowed'));
        }

        cb(null, true);
    }
});

// Apply auth & role middleware to all worker routes
router.use(protect);
router.use(verifyWorker);

// ------------------- TASKS -------------------
router.get('/tasks', getTasks);
router.put('/tasks/:task_id', updateTask);

// ------------------- FEED -------------------
router.get('/feed/page-data', getFeedPageData);
router.get('/feed/recent', getRecentFeedRecords);
router.get('/feed', getFeed);
router.post('/feed', addFeed);

// ------------------- MEDICATION -------------------
router.get('/medications/page-data', getMedicationPageData);
router.get('/medications/recent', getRecentMedicationRecords);
router.get('/medications', getMedications);
router.post('/medications', medicationUpload.single('medication_photo'), addMedication);

// ------------------- MORTALITY -------------------
router.get('/mortality/page-data', getMortalityPageData);
router.get('/mortality/recent', getRecentMortalityRecords);
router.get('/mortality/cause-summary', getMortalityCauseSummary);
router.get('/mortality', getMortality);
router.post('/mortality', addMortality);

// ------------------- BATCHES -------------------
router.get('/batches', getBatches);
router.get('/all-batches', getAllBatches);
router.get('/batches/:batch_id/details', getBatchDetails);

// ------------------- DASHBOARD -------------------
router.get('/today-summary', getTodaySummary);
router.get('/alerts', getAlerts);
router.get('/batch-status', getBatchStatus);

// ------------------- PERFORMANCE -------------------
router.get('/performance', getWorkerPerformance);

// ------------------- PICKUP ORDERS -------------------
router.get('/pickup-orders', getPickupOrders);
router.patch('/pickup-orders/:orderId/ready', markPickupReady);
router.patch('/pickup-orders/:orderId/collected', confirmPickupCollected);

// ------------------- WORKER PROFILE -------------------
router.get('/profile', getWorkerProfile);
router.patch('/profile', updateWorkerProfile);
router.patch('/profile/change-password', changeWorkerPassword);

module.exports = router;