const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, skills, college } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const otp = generateOTP();
        const otpExpires = Date.now() + 10 * 60 * 1000;

        const newUser = new User({
            name, email, password: hashedPassword, role, skills, college, otp, otpExpires
        });

        await newUser.save();

        // --- NODEMAILER INTEGRATION ---
        try {
            await sendEmail({
                email: newUser.email,
                subject: "Verify your UniLance Account",
                message: `Hi ${name}, your verification code is ${otp}. It expires in 10 minutes.`
            });
        } catch (mailError) {
            console.error("Email failed to send:", mailError);
            // We don't delete the user, just tell them to try 'Resend OTP' later
        }

        res.status(201).json({
            success: true,
            message: 'User registered. Please check your email for the OTP.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        
        const user = await User.findOne({ email }).select('+otp +otpExpires');

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        
        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP." });
        }

        
        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        
        user.isVerified = true;
        user.otp = undefined; 
        user.otpExpires = undefined; 
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: "Email verified successfully! You can now log in." 
        });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ message: "Server error during verification." });
    }
};



exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(404).json({ message: "Invalid credentials." });
        }

        
        if (!user.isVerified) {
            return res.status(401).json({ message: "Please verify your email before logging in." });
        }

        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login." });
    }
};



exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isVerified) return res.status(400).json({ message: "Account already verified" });

        const newOtp = generateOTP();
        user.otp = newOtp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        await sendEmail({
            email: user.email,
            subject: "Your New UniLance OTP",
            message: `Your new verification code is ${newOtp}.`
        });

        res.status(200).json({ success: true, message: "New OTP sent!" });
    } catch (error) {
        res.status(500).json({ message: "Error resending OTP" });
    }
};



//reset passwrd 


exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // 1. Generate a random reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // 2. Hash it and save to DB 
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min expiry

        await user.save();

        // 3. Send the Email
        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`; 
        const message = `You requested a password reset. Please click this link: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: "UniLance Password Reset",
                message
            });
            res.status(200).json({ success: true, message: "Reset link sent to email!" });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: "Email could not be sent" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                college: user.college,
                skills: user.skills
            }
        });
    } catch (error) {
        console.error("Get Me Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};