const User = require('../models/UserModel');
const Job = require('../models/JobModel');
const Review = require('../models/ReviewModel');

const getWorkerProfile = async (req, res) => {
    try {
        const { workerId } = req.params;
        const worker = await User.findById(workerId).select('-password');
        if (!worker) return res.status(404).json({ message: "Worker not found" });

        const completedJobs = await Job.find({ hiredWorkerId: workerId, status: 'COMPLETED' }).select('title budget images createdAt');
        const reviews = await Review.find({ workerId }).populate('clientId', 'name college').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: { profile: worker, stats: { totalJobs: completedJobs.length, rating: worker.rating || "No ratings yet" }, portfolio: completedJobs, reviews }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching worker profile." });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { bio, skills, portfolioLink, githubProfile } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { bio, skills, portfolioLink, githubProfile } },
            { new: true, runValidators: true }
        ).select("-password");

        res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Server error during profile update" });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password -email");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user profile" });
    }
};

const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim() === '') return res.status(400).json({ message: 'Query is required' });
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { username: { $regex: query, $options: 'i' } }
            ]
        }).select('name username profilePhoto skills rating completedJobs role');
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ message: 'Error searching users' });
    }
};

const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { profilePhoto: `/uploads/${req.file.filename}` },
            { new: true }
        ).select('profilePhoto');
        res.status(200).json({ success: true, profilePhoto: updatedUser.profilePhoto });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading profile photo' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ message: "Error fetching users." });
    }
};

// EXPLICIT EXPORT OBJECT - Makes typos impossible to miss
module.exports = {
    getWorkerProfile,
    updateProfile,
    getUserProfile,
    searchUsers,
    uploadProfilePhoto,
    getAllUsers
};
