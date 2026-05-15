/**
 * Generates a unique Department Code
 * Format: DEP-001
 */
const generateDepartmentCode = async (Model) => {
    const lastDept = await Model.findOne({ 
        departmentCode: /^DEP-/ 
    }).sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastDept && lastDept.departmentCode) {
        const parts = lastDept.departmentCode.split('-');
        const lastNumber = parseInt(parts[1]);
        nextNumber = lastNumber + 1;
    }

    return `DEP-${nextNumber.toString().padStart(3, '0')}`;
};

/**
 * Generates a unique Team Code
 * Format: TM-001
 */
const generateTeamCode = async (Model) => {
    const lastTeam = await Model.findOne({ 
        teamCode: /^TM-/ 
    }).sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastTeam && lastTeam.teamCode) {
        const parts = lastTeam.teamCode.split('-');
        const lastNumber = parseInt(parts[1]);
        nextNumber = lastNumber + 1;
    }

    return `TM-${nextNumber.toString().padStart(3, '0')}`;
};

/**
 * Generates a unique Employee Code
 * Format: EMP-0001
 */
const generateEmployeeCode = async (Model) => {
    const lastEmployee = await Model.findOne({ 
        employeeId: /^EMP-/ 
    }).sort({ employeeId: -1 }); // Sort by ID to get the highest number

    let nextNumber = 1;
    if (lastEmployee && lastEmployee.employeeId) {
        const parts = lastEmployee.employeeId.split('-');
        const lastNumber = parseInt(parts[1]);
        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }

    return `EMP-${nextNumber.toString().padStart(4, '0')}`;
};

module.exports = {
    generateDepartmentCode,
    generateTeamCode,
    generateEmployeeCode
};
