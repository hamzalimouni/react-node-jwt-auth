const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
app.use(express.json());

const users = [
    {
        id: 1,
        username: "jhon",
        password: "azerty12",
        isAdmin: true,
    },
    {
        id: 2,
        username: "laura",
        password: "azerty12",
        isAdmin: false,
    }
];

let refreshTokens = [];
app.post("/api/refresh", (req, res) => {
    // Take the refresh token from the user
    const refreshToken = req.body.token;

    // Send error if there is no token or its invalid
    if (!refreshToken) res.status(401).json("You are not authenticated!");
    if (!refreshTokens.includes(refreshToken)) {
        return res.status(401).json("Refresh token is not valid!");
    }
    jwt.verify(refreshToken, "myRefreshSecretKey", (err, user) => {
        err && console.log(err);
        refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

        const newAccessToken = generateToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.push(newRefreshToken);
        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    });
});

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, isAdmin: user.isAdmin },
        "mySecretKey",
        { expiresIn: "5s" },
    );
};
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id, isAdmin: user.isAdmin },
        "myRefreshSecretKey",
    );
};

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find((u) => {
        return u.username === username && u.password === password;
    });

    if (user) {
        // Generate an access token
        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        refreshTokens.push(refreshToken);
        res.json({
            username: user.username,
            isAdmin: user.isAdmin,
            accessToken,
            refreshToken,
        });
    }
    else {
        res.status(400).json("username or password inccorect");
    }
});

const verify = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, "mySecretKey", (err, user) => {
            if (err) return res.status(403).json("Not a valid token!");
            req.user = user;
            next();
        })
    }
    else {
        res.status(401).json("You are not authenticated!");
    }
};

app.delete("/api/users/:userId", verify, (req, res) => {
    if (req.user.id === Number(req.params.userId) || req.user.isAdmin) {
        res.status(200).json("User has been deleted.");
    }
    else {
        res.status(403).json("You are not allowed to delete this user.");
    }
});

app.post("/api/logout", verify, (req, res) => {
    const refreshToken = req.body.token;
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    res.status(200).json("You are logged out successfully!");
});

app.listen(5000, () => {
    console.log("connected");
});