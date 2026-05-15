const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        teamCode: {
            type: String,
            unique: true,
            required: true,
            uppercase: true,
            trim: true,
            index: true
        },
        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: true,
            index: true
        },
        lead: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true
        },
        reportingManager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true
        },
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        teamCapacity: {
            type: Number,
            default: 10
        },
        activeProjects: [{
            type: String,
            trim: true
        }],
        status: {
            type: String,
            enum: ["Active", "Inactive", "On Hold"],
            default: "Active",
            index: true
        },
        icon: {
            type: String,
            default: "LayoutGrid"
        },
        color: {
            type: String,
            default: "#6366f1"
        }
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

module.exports = mongoose.model("Team", teamSchema);
