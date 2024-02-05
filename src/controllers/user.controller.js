// Import necessary modules and functions
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js';

// Define the registerUser function as an asynchronous function wrapped in asyncHandler
const registerUser = asyncHandler(async (req, res) => {

   // Extract user details from the request body
   const { fullName, email, username, password } = req.body //file or json data find in body

   // Log extracted user details for debugging
   console.log("username: ", username);
   console.log("fullName: ", fullName);
   console.log("email: ", email);
   console.log("password: ", password);

   // Validate that all required fields are not empty
   if ([fullName, email, username, password].some((field) => field.trim() === "")) {
      throw new ApiError(400, "All fields are required")
   }

   // Check if a user with the same username or email already exists
   const existedUser = User.findOne({
      $or: [{ username }, { email }]
   })

   if (existedUser) {
      throw new ApiError(409, "username or email already exists")
   }

   // Extract avatar and cover image paths from the request files
   const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverIamge[0].path;

   // Validate that avatar file is present
   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar files is required")
   }

   // Upload avatar and cover image to Cloudinary
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   // Validate that avatar was successfully uploaded
   if (!avatar) {
      throw new ApiError(400, "Avatar files is required")
   }

   // Create a new user object and store it in the database
   const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })

   // Find the created user in the database and exclude sensitive fields from the response
   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken -"
   )

   // Check if user creation was successful
   if (!createdUser) {
      throw new ApiError(500, "something was wrong while registering the user")
   }

   // Return a success response with the created user details
   return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered successfully")
   )
})

// Export the registerUser function
export { registerUser }
