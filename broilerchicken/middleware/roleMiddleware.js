const verifyWorker = (req, res, next) => {
    const role = req.user?.role;
    const allowed = ["Farm Worker", "FARM WORKER", "farm worker"];

    if (!role || !allowed.includes(role)) {
        return res.status(403).json({
            message: "Access denied. Farm Workers only."
        });
    }

    next();
};

const verifyDriver = (req, res, next) => {
    const role = req.user?.role;
    const allowed = ["Driver", "DRIVER", "driver"];

    if (!role || !allowed.includes(role)) {
        return res.status(403).json({
            message: "Access denied. Driver only."
        });
    }

    next();
};

module.exports = {
    verifyWorker,
    verifyDriver
};