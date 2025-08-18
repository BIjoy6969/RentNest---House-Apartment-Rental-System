import User from "../models/User.js";

export const register = async (req,res)=>{
  try{
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  }catch(err){
    res.status(400).json({ message: err.message });
  }
}

export const login = async (req,res)=>{
  try{
    const {email,password} = req.body;
    const user = await User.findOne({ email });
    if(!user || user.password !== password) return res.status(400).json({ message:"Invalid credentials" });
    res.json(user);
  }catch(err){
    res.status(500).json({ message: err.message });
  }
}
