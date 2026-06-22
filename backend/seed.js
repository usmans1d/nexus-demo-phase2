require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus');
        console.log('Connected to MongoDB');

        // Check if Sarah exists
        const existingSarah = await User.findOne({ email: 'sarah@techwave.io' });
        if (!existingSarah) {
            const sarah = new User({
                name: 'Sarah Chen',
                email: 'sarah@techwave.io',
                password: 'password123',
                role: 'entrepreneur',
                bio: 'Passionate founder building the future of AI analytics.',
            });
            await sarah.save();
            console.log('Created Demo Entrepreneur: sarah@techwave.io');
        }

        // Check if Michael exists
        const existingMichael = await User.findOne({ email: 'michael@vcinnovate.com' });
        if (!existingMichael) {
            const michael = new User({
                name: 'Michael Rodriguez',
                email: 'michael@vcinnovate.com',
                password: 'password123',
                role: 'investor',
                bio: 'Partner at VC Innovate. Looking for Series A AI startups.',
            });
            await michael.save();
            console.log('Created Demo Investor: michael@vcinnovate.com');
        }

        console.log('Seed complete!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
