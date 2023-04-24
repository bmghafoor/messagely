const Router = require("express").Router;
const User = require("../models/user");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const ExpressError = require("../expressError");

const router = new Router();

router.get("/", ensureLoggedIn, async (req, res, next) => {
  try {
    let users = await User.all();
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
});

router.get("/:username", ensureLoggedIn, async (req, res, next) => {
  try {
    let user = await User.get(req.params.username);
    if (!user) {
      throw new ExpressError(`User ${req.params.username} does not exist`, 404);
    }
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

router.get("/:username/to", ensureCorrectUser, async (req, res, next) => {
  try {
    let user = await User.get(req.params.username);
    if (!user) {
      throw new ExpressError(`User ${req.params.username} does not exist`, 404);
    }
    let messages = await User.messagesTo(req.params.username);
    return res.json({ messages });
  } catch (error) {
    return next(error);
  }
});

router.get("/:username/from", ensureCorrectUser, async (req, res, next) => {
  try {
    let user = await User.get(req.params.username);
    if (!user) {
      throw new ExpressError(`User ${req.params.username} does not exist`, 404);
    }
    let messages = await User.messagesFrom(req.params.username);
    return res.json({ messages });
  } catch (error) {
    return next(error);
  }
});
