//this is the service or auth file for authentication
import config from "../config/config";
import { Client, Account, ID } from "appwrite";
// --------------------------------------
// const client = new Client()
//     .setEndpoint('https://<REGION>.cloud.appwrite.io/v1') // Your API Endpoint
//     .setProject('<PROJECT_ID>');                 // Your project ID

// const account = new Account(client);

// const user = await account.create({
//     userId: ID.unique(), 
//     email: 'email@example.com', 
//     password: 'password'
// });
// --------------------------------------
// Improved Code

export class AuthService {
    client = new Client()
    session = null;
    constructor() {
        this.client
            .setEndpoint(config.appwriteUrl) // Your API Endpoint
            .setProject(config.appwriteProjectId);                 // Your project ID
        this.account = new Account(this.client);
    }
    async createAccount({ email, password, name }) {
        try {
            const userAccount = await this.account.create(ID.unique(), email, password, name)
            if (userAccount) {
                //login the user call another method  
                return this.login({ email, password });
            } else {
                return userAccount
            }
        } catch (error) {
            throw error;
        }
    }
    async login({ email, password }) {
        try {
            this.session = await this.account.createEmailPasswordSession(email, password)
            return this.session
        } catch (error) {
            throw error
        }
    }
    async getCurrentUserStatus() {
        try {
            const user = await this.account.get();
            return user;
            // Logged in this will give the data about user that is logged in on current device
        } catch (error) {
            console.log('getCurrentUserError', error);
            // Not logged in
            return null;//if error then nothing maybe returned
        }
    }
    async logout() {
        try {
            await this.account.deleteSessions();
        } catch (error) {
            throw error
        }
    }

}
const authService = new AuthService();
export default authService;
