#include <iostream>
#include <mysql_driver.h>
#include <mysql_connection.h>
#include <cppconn/statement.h>
#include <cppconn/resultset.h>
#include <cppconn/prepared_statement.h>
#include <crow_all.h>
#include <string>
#include <vector>
#include <map>
#include <algorithm>
#include <cmath>
#include <memory>

using namespace std;    

// Helper function to get database connection
sql::Connection* getConnection() {
    sql::mysql::MySQL_Driver* driver = sql::mysql::get_mysql_driver_instance();
    sql::Connection* con = driver->connect("tcp://127.0.0.1:3306", "root", "root");
    con->setSchema("utem_hackathon");
    return con;
}

// Helper function to execute a query and handle errors
template<typename T>
crow::response executeQuery(T queryFunc) {
    try {
        return queryFunc();
    } catch (sql::SQLException &e) {
        return crow::response(500, string("Database error: ") + e.what());
    } catch (std::exception &e) {
        return crow::response(500, string("Server error: ") + e.what());
    }
}

int main() {
    crow::SimpleApp app;

    // CORS middleware
    auto& cors = app.get_middleware<crow::CORSHandler>();
    cors
        .global()
        .headers("Content-Type", "Authorization")
        .methods("POST"_method, "GET"_method, "PUT"_method, "DELETE"_method);

    // -------------------- User Routes --------------------
    
    // Register a new user
    CROW_ROUTE(app, "/api/register").methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if (!x) {
            return crow::response(400, "Invalid JSON");
        }
        
        if (!x.has("username") || !x.has("email") || !x.has("password")) {
            return crow::response(400, "Missing required fields");
        }
        
        string username = x["username"].s();
        string email = x["email"].s();
        string password = x["password"].s();
        
        return executeQuery([&]() {
            unique_ptr<sql::Connection> con(getConnection());
            unique_ptr<sql::PreparedStatement> pstmt(con->prepareStatement(
                "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
            ));
            
            pstmt->setString(1, username);
            pstmt->setString(2, email);
            pstmt->setString(3, password);
            
            pstmt->executeUpdate();
            
            crow::json::wvalue result;
            result["success"] = true;
            result["message"] = "User registered successfully";
            return crow::response(201, result);
        });
    });
    
    // Login
    CROW_ROUTE(app, "/api/login").methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if (!x) {
            return crow::response(400, "Invalid JSON");
        }
        
        if (!x.has("email") || !x.has("password")) {
            return crow::response(400, "Missing email or password");
        }
        
        string email = x["email"].s();
        string password = x["password"].s();
        
        return executeQuery([&]() {
            unique_ptr<sql::Connection> con(getConnection());
            unique_ptr<sql::PreparedStatement> pstmt(con->prepareStatement(
                "SELECT user_id, username FROM users WHERE email = ? AND password = ?"
            ));
            
            pstmt->setString(1, email);
            pstmt->setString(2, password);
            
            unique_ptr<sql::ResultSet> res(pstmt->executeQuery());
            
            if (res->next()) {
                crow::json::wvalue result;
                result["success"] = true;
                result["user_id"] = res->getInt("user_id");
                result["username"] = res->getString("username");
                result["email"] = email;
                return crow::response(200, result);
            } else {
                return crow::response(401, "Invalid credentials");
            }
        });
    });

    // -------------------- Places Routes --------------------
    
    // Get all places
    CROW_ROUTE(app, "/api/places").methods(crow::HTTPMethod::GET)
    ([](const crow::request& req) {
        return executeQuery([]() {
            unique_ptr<sql::Connection> con(getConnection());
            unique_ptr<sql::Statement> stmt(con->createStatement());
            unique_ptr<sql::ResultSet> res(stmt->executeQuery(
                "SELECT p.*, "
                "(SELECT AVG(stars) FROM ratings r WHERE r.place_id = p.place_id) as avg_rating, "
                "(SELECT COUNT(*) FROM ratings r WHERE r.place_id = p.place_id) as review_count "
                "FROM places p"
            ));
            
            crow::json::wvalue result;
            vector<crow::json::wvalue> places;
            
            while (res->next()) {
                crow::json::wvalue place;
                place["place_id"] = res->getInt("place_id");
                place["name"] = res->getString("name");
                place["description"] = res->getString("description");
                place["latitude"] = res->getDouble("latitude");
                place["longitude"] = res->getDouble("longitude");
                
                // Handle NULL values for ratings
                sql::ResultSetMetaData *meta = res->getMetaData();
                if (res->isNull(meta->getColumnName(8))) {
                    place["avg_rating"] = 0;
                } else {
                    place["avg_rating"] = res->getDouble("avg_rating");
                }
                
                place["review_count"] = res->getInt("review_count");
                places.push_back(std::move(place));
            }
            
            result["places"] = std::move(places);
            return crow::response(200, result);
        });
    });
    
    // Get a single place by ID
    CROW_ROUTE(app, "/api/places/<int>").methods(crow::HTTPMethod::GET)
    ([](const crow::request& req, int place_id) {
        return executeQuery([&]() {
            unique_ptr<sql::Connection> con(getConnection());
            
            // Get place details
            unique_ptr<sql::PreparedStatement> pstmt(con->prepareStatement(
                "SELECT p.*, "
                "(SELECT AVG(stars) FROM ratings r WHERE r.place_id = p.place_id) as avg_rating, "
                "(SELECT COUNT(*) FROM ratings r WHERE r.place_id = p.place_id) as review_count "
                "FROM places p WHERE p.place_id = ?"
            ));
            
            pstmt->setInt(1, place_id);
            unique_ptr<sql::ResultSet> res(pstmt->executeQuery());
            
            if (!res->next()) {
                return crow::response(404, "Place not found");
            }
            
            crow::json::wvalue result;
            result["place_id"] = res->getInt("place_id");
            result["name"] = res->getString("name");
            result["description"] = res->getString("description");
            result["latitude"] = res->getDouble("latitude");
            result["longitude"] = res->getDouble("longitude");
            
            // Handle NULL values for ratings
            sql::ResultSetMetaData *meta = res->getMetaData();
            if (res->isNull(meta->getColumnName(8))) {
                result["avg_rating"] = 0;
            } else {
                result["avg_rating"] = res->getDouble("avg_rating");
            }
            
            result["review_count"] = res->getInt("review_count");
            
            // Get reviews for this place
            unique_ptr<sql::PreparedStatement> reviewStmt(con->prepareStatement(
                "SELECT r.*, u.username "
                "FROM ratings r "
                "JOIN users u ON r.user_id = u.user_id "
                "WHERE r.place_id = ? "
                "ORDER BY r.created_at DESC"
            ));
            
            reviewStmt->setInt(1, place_id);
            unique_ptr<sql::ResultSet> reviewRes(reviewStmt->executeQuery());
            
            vector<crow::json::wvalue> reviews;
            while (reviewRes->next()) {
                crow::json::wvalue review;
                review["rating_id"] = reviewRes->getInt("rating_id");
                review["user_id"] = reviewRes->getInt("user_id");
                review["username"] = reviewRes->getString("username");
                review["stars"] = reviewRes->getInt("stars");
                review["comment"] = reviewRes->getString("comment");
                review["created_at"] = reviewRes->getString("created_at");
                reviews.push_back(std::move(review));
            }
            
            result["reviews"] = std::move(reviews);
            return crow::response(200, result);
        });
    });
    
    // Add a new place
    CROW_ROUTE(app, "/api/places").methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if (!x) {
            return crow::response(400, "Invalid JSON");
        }
        
        if (!x.has("name") || !x.has("latitude") || !x.has("longitude")) {
            return crow::response(400, "Missing required fields");
        }
        
        return executeQuery([&]() {
            unique_ptr<sql::Connection> con(getConnection());
            unique_ptr<sql::PreparedStatement> pstmt(con->prepareStatement(
                "INSERT INTO places (name, description, latitude, longitude) "
                "VALUES (?, ?, ?, ?)"
            ));
            
            pstmt->setString(1, x["name"].s());
            pstmt->setString(2, x.has("description") ? x["description"].s() : "");
            pstmt->setDouble(3, x["latitude"].d());
            pstmt->setDouble(4, x["longitude"].d());
            
            pstmt->executeUpdate();
            
            // Get the last inserted ID
            unique_ptr<sql::Statement> stmt(con->createStatement());
            unique_ptr<sql::ResultSet> res(stmt->executeQuery("SELECT LAST_INSERT_ID()"));
            res->next();
            int place_id = res->getInt(1);
            
            crow::json::wvalue result;
            result["success"] = true;
            result["place_id"] = place_id;
            result["message"] = "Place added successfully";
            return crow::response(201, result);
        });
    });

    // -------------------- Ratings Routes --------------------
    
    // Add a rating to a place
    CROW_ROUTE(app, "/api/ratings").methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if (!x) {
            return crow::response(400, "Invalid JSON");
        }
        
        if (!x.has("user_id") || !x.has("place_id") || !x.has("stars")) {
            return crow::response(400, "Missing required fields");
        }
        
        int stars = x["stars"].i();
        if (stars < 1 || stars > 5) {
            return crow::response(400, "Stars must be between 1 and 5");
        }
        
        return executeQuery([&]() {
            unique_ptr<sql::Connection> con(getConnection());
            
            // Check if user already rated this place
            unique_ptr<sql::PreparedStatement> checkStmt(con->prepareStatement(
                "SELECT rating_id FROM ratings WHERE user_id = ? AND place_id = ?"
            ));
            
            checkStmt->setInt(1, x["user_id"].i());
            checkStmt->setInt(2, x["place_id"].i());
            
            unique_ptr<sql::ResultSet> checkRes(checkStmt->executeQuery());
            
            if (checkRes->next()) {
                // Update existing rating
                unique_ptr<sql::PreparedStatement> updateStmt(con->prepareStatement(
                    "UPDATE ratings SET stars = ?, comment = ? WHERE rating_id = ?"
                ));
                
                updateStmt->setInt(1, stars);
                updateStmt->setString(2, x.has("comment") ? x["comment"].s() : "");
                updateStmt->setInt(3, checkRes->getInt("rating_id"));
                
                updateStmt->executeUpdate();
                
                crow::json::wvalue result;
                result["success"] = true;
                result["message"] = "Rating updated successfully";
                return crow::response(200, result);
            } else {
                // Insert new rating
                unique_ptr<sql::PreparedStatement> insertStmt(con->prepareStatement(
                    "INSERT INTO ratings (user_id, place_id, stars, comment) VALUES (?, ?, ?, ?)"
                ));
                
                insertStmt->setInt(1, x["user_id"].i());
                insertStmt->setInt(2, x["place_id"].i());
                insertStmt->setInt(3, stars);
                insertStmt->setString(4, x.has("comment") ? x["comment"].s() : "");
                
                insertStmt->executeUpdate();
                
                crow::json::wvalue result;
                result["success"] = true;
                result["message"] = "Rating added successfully";
                return crow::response(201, result);
            }
        });
    });
    
    // Get ratings for a place
    CROW_ROUTE(app, "/api/places/<int>/ratings").methods(crow::HTTPMethod::GET)
    ([](const crow::request& req, int place_id) {
        return executeQuery([&]() {
            unique_ptr<sql::Connection> con(getConnection());
            unique_ptr<sql::PreparedStatement> pstmt(con->prepareStatement(
                "SELECT r.*, u.username "
                "FROM ratings r "
                "JOIN users u ON r.user_id = u.user_id "
                "WHERE r.place_id = ? "
                "ORDER BY r.created_at DESC"
            ));
            
            pstmt->setInt(1, place_id);
            unique_ptr<sql::ResultSet> res(pstmt->executeQuery());
            
            crow::json::wvalue result;
            vector<crow::json::wvalue> ratings;
            
            while (res->next()) {
                crow::json::wvalue rating;
                rating["rating_id"] = res->getInt("rating_id");
                rating["user_id"] = res->getInt("user_id");
                rating["username"] = res->getString("username");
                rating["stars"] = res->getInt("stars");
                rating["comment"] = res->getString("comment");
                rating["created_at"] = res->getString("created_at");
                ratings.push_back(std::move(rating));
            }
            
            result["ratings"] = std::move(ratings);
            return crow::response(200, result);
        });
    });

    // Start the server
    cout << "Starting Crow server on port 8080..." << endl;
    app.port(8080).multithreaded().run();

    return 0;
}
