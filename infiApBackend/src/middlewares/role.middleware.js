// Role-Based Access Control
const verifyRole = (roles) => {
    return (req, res, next) => {
        const role = req.user?.role === "main_admin" ? "superadmin" : req.user?.role;

        if (req.user && role) {
            req.user.role = role;
        }

        if (!role || !roles.includes(role)) {
            return res
                .status(403)
                .json({ message: "Access Denied: Insufficient Permissions" });
        }
        next();
    };
};

module.exports = { verifyRole };
