import Booking from "../models/Booking.js";

export const createBooking = async (req,res)=>{
  try{
    const booking = new Booking(req.body);
    await booking.save();
    res.status(201).json(booking);
  }catch(err){ res.status(400).json({ message:err.message }); }
}

export const updateBooking = async (req,res)=>{
  try{
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status:req.body.status }, { new:true });
    res.json(booking);
  }catch(err){ res.status(400).json({ message:err.message }); }
}

export const getTenantBookings = async (req,res)=>{
  try{
    const bookings = await Booking.find({ tenantId:req.params.tenantId }).populate("propertyId");
    res.json(bookings);
  }catch(err){ res.status(500).json({ message:err.message }); }
}
