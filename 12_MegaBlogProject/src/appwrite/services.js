//This files consists of functionality about database and storage access from our backend
import config from "../config/config";
import { Client, ID, Databases, Storage, Query } from "appwrite";

export class Service {
    client = new Client();
    databases;
    bucket;
    constructor() {
        this.client
            .setEndpoint(config.appwriteUrl) // Your API Endpoint
            .setProject(config.appwriteProjectId);
        this.databases = new Databases(this.client);
        this.bucket = new Storage(this.client)
    }
    async createPost({ title, slug, content, featuredImage, status, userId }) {
        try {
            return await this.databases.createDocument(
                config.appwriteDatabaseId,
                config.appwriteCollectionId,
                ID.unique(),
                {
                    title,
                    content,
                    featuredImage,
                    status,
                    slug,
                    userId
                }
            )
        } catch (error) {
            console.log("Error in CreatePost", error);
            throw error;
        }
    }
    async updatePost(PostId, { title, content, featuredImage, status,slug }) {
        try {
            return await this.databases.updateDocument(
                config.appwriteDatabaseId,
                config.appwriteCollectionId,
                PostId,
                {
                    title,
                    content,
                    featuredImage,
                    status,
                    slug
                })
        } catch (error) {
            console.log("Error in UpdatePost", error);
            throw error;
        }
    }
    async deletePost(PostId) {
        try {
            await this.databases.deleteDocument(
                config.appwriteDatabaseId,
                config.appwriteCollectionId,
                PostId
            )
            return true;

        } catch (error) {
            console.log("Error in DeletePost", error);
            return false;
        }
    }
    async getPost(PostId) {
        try {
            return await this.databases.getDocument(
                config.appwriteDatabaseId,
                config.appwriteCollectionId,
                PostId
            )

        } catch (error) {
            console.log("Error in GetPost", error);
            return false;
        }
    }
    async getPosts(queries = [Query.equal("status", true)]) {
        try {
            return await this.databases.listDocuments(
                config.appwriteDatabaseId,
                config.appwriteCollectionId,
                queries                          //[Query.equal("status",true)]
            )
        } catch (error) {
            console.log("Error in getPosts", error);
            return false;

        }
    }
    //can be done in a seperate file for storage
    async uploadFile(file) {
        try {
            return await this.bucket.createFile(
                config.appwriteBucketId,
                ID.unique(),
                file
            )
        } catch (error) {
            console.log("Error in UploadFile", error);
            return false;
        }
    }
    async getFile(fileId) {
        try {
            return await this.bucket.getFile(
                config.appwriteBucketId,
                fileId
            )

        } catch (error) {
            console.log("Error in GetFile", error);
            return false;
        }
    }

    async deleteFile(fileId) {
        try {
            await this.bucket.deleteFile(
                config.appwriteBucketId,
                fileId
            )
            return true;

        } catch (error) {
            console.log("Error in DeleteFile", error);
            return false;
        }
    }
    getFilePreview(fileId){
        if (!fileId) return null;
        return this.bucket.getFilePreview(
            config.appwriteBucketId,
            fileId
        )
    }
}
const service = new Service();
export default service;