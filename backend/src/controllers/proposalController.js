const Proposal = require('../models/ProposalModel');
const Job = require('../models/JobModel');
const sendEmail = require('../utils/sendEmail');


exports.applyToJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { proposalText, proposedPrice, estimatedDays } = req.body;

        // 1. Find the job and populate the Client's email/name
        const job = await Job.findById(jobId).populate('clientId', 'name email');
        if (!job) return res.status(404).json({ message: "Job not found" });
 
        // 2. Save the Proposal
        const newProposal = new Proposal({
            jobId,
            workerId: req.user.id,
            proposalText,
            proposedPrice,
            estimatedDays
        });
        await newProposal.save();


        // 3. SEND NOTIFICATION TO CLIENT
        try {
            await sendEmail({
                email: job.clientId.email,
                subject: `New Applicant: ${job.title}`,
                message: `Hi ${job.clientId.name}, a student has applied for your job "${job.title}". \n\nBid: ₹${proposedPrice} \nLog in to UniLance to review the proposal.`
            });
        } catch (err) {
            console.error("Notification email to client failed:", err);
        }

        // 4. SEND NOTIFICATION TO WORKER
        try {
            // Populate worker details
            const worker = req.user;
            await sendEmail({
                email: worker.email,
                subject: `Application Submitted: ${job.title}`,
                message: `Hi ${worker.name}, your application for the job "${job.title}" has been submitted successfully.\n\nBid: ₹${proposedPrice}\nThe client will review your proposal and contact you if interested. Good luck!`
            });
        } catch (err) {
            console.error("Notification email to worker failed:", err);
        }

        res.status(201).json({ success: true, message: "Proposal submitted!" });

    } catch (error) {
        console.error("Apply to Job Error:", error);
        res.status(500).json({ message: "Server error while applying to job." });
    }
};

// GET ALL PROPOSALS FOR A JOB
exports.getProposalsByJob = async (req, res) => {
    try {
        const proposals = await Proposal.find({ jobId: req.params.jobId })
            .populate('workerId', 'name rating college skills');
        
        res.status(200).json({ success: true, proposals });
    } catch (error) {
        res.status(500).json({ message: "Error fetching proposals." });
    }
};


//accept proposal (Client only) 

exports.acceptProposal = async (req, res) => {
    try {
        const { proposalId } = req.params;

        // find proposal and populate the Worker's details
        const proposal = await Proposal.findById(proposalId)
            .populate('jobId')
            .populate('workerId', 'name email');
        
        if (!proposal) return res.status(404).json({ message: "Proposal not found" });

        const job = proposal.jobId;
        const worker = proposal.workerId;

        // 2. Ensure the requester is the Client who posted the job
        if (job.clientId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only the job owner can accept proposals." });
        }

        // 2. Mark as ACCEPTED and update Job
        proposal.status = 'ACCEPTED';
        await proposal.save();

        job.status = 'HIRED';
        job.hiredWorkerId = worker._id;
        await job.save();

        // 3. SEND NOTIFICATION TO WORKER
        try {
            await sendEmail({
                email: worker.email,
                subject: `You've been HIRED! - ${job.title}`,
                message: `Congratulations ${worker.name}! \n\nYour proposal for "${job.title}" has been accepted. \nPlease contact the client to discuss the next steps. \n\nHappy working!`
            });
        } catch (err) {
            console.error("Hiring email failed:", err);
        }


            await Proposal.updateMany(
                { jobId: job._id, status: 'PENDING', _id: { $ne: proposalId } },
                { status: 'REJECTED' }
            );

        res.status(200).json({ success: true, message: "Worker hired and notified!" });

    } catch (error) {
        
        console.error("Accept Proposal Error:", error);
        res.status(500).json({ message: "Server error while accepting proposal." });
    }
};

exports.rejectProposal = async (req, res) => {
    try {
        const { proposalId } = req.params;

        const proposal = await Proposal.findById(proposalId).populate('workerId', 'name email').populate('jobId', 'title clientId');
        if (!proposal) return res.status(404).json({ message: "Proposal not found" });

        // Check if the client owns the job
        if (proposal.jobId.clientId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        proposal.status = 'REJECTED';
        await proposal.save();

        // SEND NOTIFICATION TO WORKER
        try {
            await sendEmail({
                email: proposal.workerId.email,
                subject: `Proposal Rejected - ${proposal.jobId.title}`,
                message: `Hi ${proposal.workerId.name}, \n\nUnfortunately, your proposal for "${proposal.jobId.title}" has been rejected. \n\nKeep applying to other jobs!`
            });
        } catch (err) {
            console.error("Rejection email failed:", err);
        }

        res.status(200).json({ success: true, message: "Proposal rejected!" });

    } catch (error) {
        console.error("Reject Proposal Error:", error);
        res.status(500).json({ message: "Server error while rejecting proposal." });
    }
};

exports.getMyProposals = async (req, res) => {
    try {
        const proposals = await Proposal.find({ workerId: req.user.id })
            .populate('jobId', 'title description budget status');
        res.status(200).json({ success: true, proposals });
    } catch (error) {
        console.error("Get My Proposals Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.checkApplied = async (req, res) => {
    try {
        const { jobId } = req.params;
        const proposal = await Proposal.findOne({ jobId, workerId: req.user.id });
        res.status(200).json({ applied: !!proposal });
    } catch (error) {
        console.error("Check Applied Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


exports.updateProjectStatus = async (req, res) => {
    const { status } = req.body; // 'delivered' or 'completed'
    try {
        const proposal = await Proposal.findByIdAndUpdate(req.params.id, { status }, { new: true });
        
        
        if (status === 'completed') {
            await Job.findByIdAndUpdate(proposal.jobId, { status: 'CLOSED' });
        }
        
        res.json({ success: true, proposal });
    } catch (err) {
        res.status(500).json({ message: "Update failed" });
    }
};