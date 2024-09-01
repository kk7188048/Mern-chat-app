import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";



export const signup = async (req, res) => {
	console.log("Signup request:", req.body);
	try {
		const { fullName, username, password, confirmPassword, gender } = req.body;

		console.log("Signup request data:", req.body);

		// Check if passwords match
		if (password !== confirmPassword) {
			console.log("Passwords do not match");
			return res.status(400).json({ error: "Passwords don't match" });
		}

		// Check if username already exists
		const user = await User.findOne({ username });
		if (user) {
			console.log("Username already exists:", username);
			return res.status(400).json({ error: "Username already exists" });
		}

		// Hash the password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		console.log("Hashed password:", hashedPassword); // Debug: Log hashed password

		// Generate profile picture URL based on gender
		const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
		const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;
		console.log("Profile picture URL:", gender === "male" ? boyProfilePic : girlProfilePic); // Debug: Log profile picture URL

		// Create a new user instance
		const newUser = new User({
			fullName,
			username,
			password: hashedPassword,
			gender,
			profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
		});

		// Save the new user
		await newUser.save(); // Moved this line before generating the token to ensure the user is saved first
		console.log("New user created:", newUser); // Debug: Log the new user object

		// Generate JWT token and set cookie
		generateTokenAndSetCookie(newUser._id, res);
		console.log("JWT token generated and cookie set for user ID:", newUser._id); // Debug: Log token generation

		// Respond with the new user data
		res.status(201).json({
			_id: newUser._id,
			fullName: newUser.fullName,
			username: newUser.username,
			profilePic: newUser.profilePic,
		});
	} catch (error) {
		console.error("Error in signup controller:", error); // Log the entire error object for more context
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const login = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		if (!user || !isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid username or password" });
		}

		generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			profilePic: user.profilePic,
		});
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const logout = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
