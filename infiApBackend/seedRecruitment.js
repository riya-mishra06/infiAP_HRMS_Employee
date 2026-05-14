const mongoose = require("mongoose");
const Job = require("./src/models/job.model");
const Candidate = require("./src/models/candidate.model");
const User = require("./src/models/user.model");
require("dotenv").config();

const seedRecruitment = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB...");

        // Clear existing recruitment data
        await Job.deleteMany({});
        await Candidate.deleteMany({});
        console.log("Cleared old recruitment data.");

        const hr = await User.findOne({ role: "hr" });
        if (!hr) {
            console.log("HR user not found. Please create one first.");
            process.exit(1);
        }

        const jobs = [
            {
                title: "Sr. Software Engineer",
                department: "Technology",
                location: "New York / Remote",
                type: "Full-time",
                description: "Looking for a React and Node.js expert.",
                experienceYears: 5,
                requirements: ["React", "Node.js", "MongoDB"],
                salaryRange: { min: 120000, max: 180000 },
                status: "Open",
                postedBy: hr._id
            },
            {
                title: "Product Designer",
                department: "Design",
                location: "London",
                type: "Full-time",
                description: "Lead our UX/UI initiatives.",
                experienceYears: 3,
                requirements: ["Figma", "UI Design", "User Research"],
                salaryRange: { min: 90000, max: 130000 },
                status: "Open",
                postedBy: hr._id
            },
            {
                title: "Marketing Lead",
                department: "Marketing",
                location: "Remote",
                type: "Contract",
                description: "Drive growth and brand awareness.",
                experienceYears: 7,
                requirements: ["Growth Hacking", "SEO", "Ads"],
                salaryRange: { min: 80000, max: 120000 },
                status: "Open",
                postedBy: hr._id
            }
        ];

        const insertedJobs = await Job.insertMany(jobs);
        console.log(`Inserted ${insertedJobs.length} jobs.`);

        const candidates = [
            {
                jobId: insertedJobs[0]._id,
                jobTitle: insertedJobs[0].title,
                applicantName: "Alex Rivers",
                email: "alex.rivers@example.com",
                phone: "+1 555-0101",
                profileImage: "https://i.pravatar.cc/150?u=alex",
                yearsOfExperience: 8,
                location: "New York",
                status: "Applied",
                source: "LinkedIn"
            },
            {
                jobId: insertedJobs[0]._id,
                jobTitle: insertedJobs[0].title,
                applicantName: "Sarah Chen",
                email: "sarah.chen@example.com",
                phone: "+1 555-0102",
                profileImage: "https://i.pravatar.cc/150?u=sarah",
                yearsOfExperience: 5,
                location: "San Francisco",
                status: "Technical Interview",
                source: "Referral",
                technicalInterview: {
                    date: new Date(Date.now() + 86400000),
                    interviewer: "John Doe",
                    status: "Pending"
                }
            },
            {
                jobId: insertedJobs[1]._id,
                jobTitle: insertedJobs[1].title,
                applicantName: "Marcus Thompson",
                email: "marcus.t@example.com",
                phone: "+1 555-0103",
                profileImage: "https://i.pravatar.cc/150?u=marcus",
                yearsOfExperience: 12,
                location: "London",
                status: "Shortlisted",
                source: "Indeed"
            }
        ];

        await Candidate.insertMany(candidates);
        console.log("Inserted sample candidates.");

        console.log("Recruitment seeding completed!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding recruitment:", error);
        process.exit(1);
    }
};

seedRecruitment();
