import db from "../models/db.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import { getInsertQuery } from '../utils/structure.js'
const redis = new Redis();


export const handleSignUp = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // Insert into Database
    const q = getInsertQuery("account", { username, email, password: hashedPassword }, true);
    db.query(q, (insertError) => {
      if (insertError) {
        return res.status(500).json({ error: 'Internal server error' });
      }
      return res.status(201).json({ message: 'User created successfully' });
    });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }

}
// 
export const handleSignIn = async(req, res) => {
  const { user, body } = req;
  const username = user.username
  const maxAttempts = 5;
  const lockoutTime = 120;
  const lockoutKey = `lockout: ${username}`;
  const attemptsKey = `attemps: ${username}`;

  // check if the account is locked
  const isLock = await redis.get(lockoutKey);
  if(isLock){
    const remainingTime = await redis.ttl(lockoutKey);
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    if(remainingTime > 0){
      return res.status(403).json({message: `Account is locked. Please try again after ${minutes} minutes and ${seconds} seconds.`});
    }else{
       await redis.del(lockoutKey, attemptsKey);
    }
  }
    bcrypt.compare(body.password, user.password, async(err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Password comparison error' });
      }
      if (isMatch) {
        await redis.del(attemptsKey);
        const token = jwt.sign({ userId: user.uid }, 'LTT-secret-key');
        return res.json({username: user.username,token: token});
      }
      else{
        let attempts = await redis.incr(attemptsKey);
        if (attempts >= maxAttempts) {
          // Lock the account and set a timer
          await redis.setex(lockoutKey, lockoutTime, 'locked');
        }
      return res.status(401).json({ error: 'Wrong password' });
  
      }
    })
  }
