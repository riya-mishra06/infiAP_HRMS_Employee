const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        departmentCode: {
            type: String,
            unique: true,
            required: true,
            uppercase: true,
            trim: true,
            index: true
        },
        description: {
            type: String,
            trim: true
        },
        category: {
            type: String,
            trim: true
        },
        primaryLocation: {
            type: String,
            trim: true,
            default: "Headquarters"
        },
        teamCapacity: {
            type: Number,
            default: 10
        },
        head: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            index: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        status: {
            type: String,
            enum: ["Active", "Inactive", "Archived"],
            default: "Active",
            index: true
        }
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for teams in this department
departmentSchema.virtual('teams', {
    ref: 'Team',
    localField: '_id',
    foreignField: 'departmentId'
});

// Virtual for employees in this department
departmentSchema.virtual('employeeList', {
    ref: 'User',
    localField: '_id',
    foreignField: 'departmentId'
});

module.exports = mongoose.model("Department", departmentSchema);
