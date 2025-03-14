const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

// โหลดค่าตัวแปรจากไฟล์ .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors());

// สร้าง Schema และ Model สำหรับ Profile
const ProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bio: { type: String },
  education: { type: String },
  workExperience: { type: String },
  skills: { type: String },
  portfolio: { type: String },
  awards: { type: String },
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
});

const Profile = mongoose.model("Profile", ProfileSchema);

// เชื่อมต่อ MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// API: ตรวจสอบโปรไฟล์
app.get("/api/check-profile", async (req, res) => {
  const { walletAddress } = req.query;

  try {
    if (!walletAddress) {
      res.status(400).send({ message: "walletAddress is required" });
      return;
    }

    const profile = await Profile.findOne({
      walletAddress: walletAddress.toLowerCase().trim(),
    });

    res.status(200).send({
      exists: !!profile,
      profile: profile || null,
    });
  } catch (error) {
    console.error("Profile check error:", error);
    res.status(500).send({
      message: "Error checking profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/profile", async (req, res) => {
  const {
    name,
    walletAddress,
    bio,
    education,
    workExperience,
    skills,
    portfolio,
    awards,
  } = req.body;

  // บังคับเฉพาะ name และ walletAddress
  if (!walletAddress || !name) {
    res.status(400).send({ message: "Name and walletAddress are required" });
    return;
  }

  try {
    // ตรวจสอบว่ามีโปรไฟล์อยู่ในฐานข้อมูลหรือไม่
    const existingProfile = await Profile.findOne({ walletAddress });

    if (existingProfile) {
      // อัปเดตโปรไฟล์ที่มีอยู่
      const updatedProfile = await Profile.findOneAndUpdate(
        { walletAddress },
        {
          $set: {
            name,
            bio,
            education,
            workExperience,
            skills,
            portfolio,
            awards,
          },
        },
        { new: true } // คืนค่าข้อมูลโปรไฟล์ที่อัปเดต
      );
      res.status(200).send({
        message: "Profile updated successfully!",
        profile: updatedProfile,
      });
    } else {
      // สร้างโปรไฟล์ใหม่
      const newProfile = new Profile({
        name,
        walletAddress,
        bio,
        education,
        workExperience,
        skills,
        portfolio,
        awards,
      });
      await newProfile.save();
      res.status(201).send({
        message: "Profile created successfully!",
        profile: newProfile,
      });
    }
  } catch (error) {
    console.error("Error saving profile:", error);
    res.status(500).send({
      message: "Error saving profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// API: ดึงข้อมูลโปรไฟล์ทั้งหมด
app.get("/api/profile", async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.status(200).send(profiles);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).send({
      message: "Error fetching profiles",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// API: ดึงข้อมูลโปรไฟล์ตาม Wallet Address
app.get("/api/profile/:walletAddress", async (req, res) => {
  const { walletAddress } = req.params;

  try {
    const profile = await Profile.findOne({
      walletAddress: walletAddress.toLowerCase().trim(),
    });

    if (!profile) {
      res.status(404).send({ message: "Profile not found" });
      return;
    }

    res.status(200).send(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).send({
      message: "Error fetching profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});