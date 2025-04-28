#include <iostream>
#include <mysql_driver.h>
#include <mysql_connection.h>
#include <cppconn/statement.h>
#include <cppconn/resultset.h>
#include <cppconn/prepared_statement.h>
#include "crow_all.h"
#include <string>
#include <vector>
#include <map>
#include <algorithm>
#include <cmath>
#include <memory>

// Use specific namespaces to avoid ambiguity
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
        crow::json::wvalue error;
        error["success"] = false;
        error["message"] = std::string("Database error: ") + e.what();
        return crow::response(500, error);
    } catch (std::exception &e) {
        crow::json::wvalue error;
        error["success"] = false;
        error["message"] = std::string("Server error: ") + e.what();
        return crow::response(500, error);
    }
}

int main() {
    // Change from SimpleApp to App with CORSHandler
    crow::App<crow::CORSHandler> app;

    // Add a simple root route
    CROW_ROUTE(app, "/")([](){
        return "Hello world";
    });

    // CORS middleware
    auto& cors = app.get_middleware<crow::CORSHandler>();
    cors
        .global()
        .headers("Content-Type", "Authorization")
        .methods("POST"_method, "GET"_method, "PUT"_method, "DELETE"_method);

    // -------------------- User Routes --------------------
    
    // Register a new user
    CROW_ROUTE(app, "/api/register").methods("POST"_method)(
        [](const crow::request& req) {
            auto x = crow::json::load(req.body);
            if (!x) return crow::response(400, "Invalid JSON");
            
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
        }
    );
    
    // Login
    CROW_ROUTE(app, "/api/login").methods("POST"_method)(
        [](const crow::request& req) {
            auto x = crow::json::load(req.body);
            if (!x) return crow::response(400, "Invalid JSON");
            
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
        }
    );

    // -------------------- Places Routes --------------------
    
    // Get all places
    CROW_ROUTE(app, "/api/places").methods("GET"_method)(
        [](const crow::request& req) {
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
                    place["latitude"] = static_cast<double>(res->getDouble("latitude"));
                    place["longitude"] = static_cast<double>(res->getDouble("longitude"));
                    
                    // Handle NULL values for ratings
                    if (res->isNull("avg_rating")) {
                        place["avg_rating"] = 0.0;
                    } else {
                        place["avg_rating"] = static_cast<double>(res->getDouble("avg_rating"));
                    }
                    
                    place["review_count"] = res->getInt("review_count");
                    places.push_back(std::move(place));
                }
                
                result["places"] = std::move(places);
                return crow::response(200, result);
            });
        }
    );
    
    // Get a single place by ID - FIXED: Use string parameter instead of int
    CROW_ROUTE(app, "/api/places/<string>").methods("GET"_method)(
        [](const crow::request& req, const string& place_id_str) {
            return executeQuery([&]() {
                int place_id = stoi(place_id_str);
                
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
                result["latitude"] = static_cast<double>(res->getDouble("latitude"));
                result["longitude"] = static_cast<double>(res->getDouble("longitude"));
                
                // Handle NULL values for ratings
                if (res->isNull("avg_rating")) {
                    result["avg_rating"] = 0.0;
                } else {
                    result["avg_rating"] = static_cast<double>(res->getDouble("avg_rating"));
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
        }
    );
    
    // Add a new place
    CROW_ROUTE(app, "/api/places").methods("POST"_method)(
        [](const crow::request& req) {
            auto x = crow::json::load(req.body);
            if (!x) return crow::response(400, "Invalid JSON");
            
            if (!x.has("name") || !x.has("latitude") || !x.has("longitude")) {
                return crow::response(400, "Missing required fields");
            }
            
            return executeQuery([&]() {
                unique_ptr<sql::Connection> con(getConnection());
                unique_ptr<sql::PreparedStatement> pstmt(con->prepareStatement(
                    "INSERT INTO places (name, description, latitude, longitude) "
                    "VALUES (?, ?, ?, ?)"
                ));
                
                std::string name = x["name"].s();
                std::string description = x.has("description") ? std::string(x["description"].s()) : std::string("");
                
                pstmt->setString(1, name);
                pstmt->setString(2, description);
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
        }
    );

    // -------------------- Ratings Routes --------------------
    
    // Add a rating to a place
    CROW_ROUTE(app, "/api/ratings").methods("POST"_method)(
        [](const crow::request& req) {
            auto x = crow::json::load(req.body);
            if (!x) return crow::response(400, "Invalid JSON");
            
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
                    
                    std::string comment = x.has("comment") ? std::string(x["comment"].s()) : std::string("");
                    
                    updateStmt->setInt(1, stars);
                    updateStmt->setString(2, comment);
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
                    
                    std::string comment = x.has("comment") ? std::string(x["comment"].s()) : std::string("");
                    
                    insertStmt->setInt(1, x["user_id"].i());
                    insertStmt->setInt(2, x["place_id"].i());
                    insertStmt->setInt(3, stars);
                    insertStmt->setString(4, comment);
                    
                    insertStmt->executeUpdate();
                    
                    crow::json::wvalue result;
                    result["success"] = true;
                    result["message"] = "Rating added successfully";
                    return crow::response(201, result);
                }
            });
        }
    );
    
    // Get ratings for a place - FIXED: Use string parameter instead of int
    CROW_ROUTE(app, "/api/places/<string>/ratings").methods("GET"_method)(
        [](const crow::request& req, const string& place_id_str) {
            return executeQuery([&]() {
                int place_id = stoi(place_id_str);
                
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
        }
    );

    // -------------------- Other Routes --------------------
    
    // Get top-rated places
    CROW_ROUTE(app, "/api/places/top-rated").methods("GET"_method)(
        [](const crow::request& req) {
            return executeQuery([]() {
                unique_ptr<sql::Connection> con(getConnection());
                unique_ptr<sql::Statement> stmt(con->createStatement());
                
                unique_ptr<sql::ResultSet> res(stmt->executeQuery(
                    "SELECT p.place_id, p.name, p.description, p.latitude, p.longitude, "
                    "AVG(r.stars) as average_rating, COUNT(r.rating_id) as review_count "
                    "FROM places p "
                    "LEFT JOIN ratings r ON p.place_id = r.place_id "
                    "GROUP BY p.place_id "
                    "HAVING COUNT(r.rating_id) > 0 "
                    "ORDER BY average_rating DESC, review_count DESC "
                    "LIMIT 10"
                ));
                
                crow::json::wvalue result;
                vector<crow::json::wvalue> places;
                
                while (res->next()) {
                    crow::json::wvalue place;
                    place["place_id"] = res->getInt("place_id");
                    place["name"] = res->getString("name");
                    place["description"] = res->getString("description");
                    place["latitude"] = static_cast<double>(res->getDouble("latitude"));
                    place["longitude"] = static_cast<double>(res->getDouble("longitude"));
                    place["average_rating"] = static_cast<double>(res->getDouble("average_rating"));
                    place["review_count"] = res->getInt("review_count");
                    places.push_back(std::move(place));
                }
                
                result["top_rated_places"] = std::move(places);
                return crow::response(200, result);
            });
        }
    );
    
    // Get rating statistics
    CROW_ROUTE(app, "/api/statistics/ratings").methods("GET"_method)(
        [](const crow::request& req) {
            return executeQuery([]() {
                unique_ptr<sql::Connection> con(getConnection());
                unique_ptr<sql::Statement> stmt(con->createStatement());
                
                unique_ptr<sql::ResultSet> res(stmt->executeQuery(
                    "SELECT p.place_id, p.name, "
                    "COUNT(r.rating_id) as total_reviews, "
                    "AVG(r.stars) as average_rating, "
                    "MIN(r.stars) as lowest_rating, "
                    "MAX(r.stars) as highest_rating "
                    "FROM places p "
                    "LEFT JOIN ratings r ON p.place_id = r.place_id "
                    "GROUP BY p.place_id "
                    "ORDER BY average_rating DESC"
                ));
                
                crow::json::wvalue result;
                vector<crow::json::wvalue> stats;
                
                while (res->next()) {
                    crow::json::wvalue stat;
                    stat["place_id"] = res->getInt("place_id");
                    stat["name"] = res->getString("name");
                    stat["total_reviews"] = res->getInt("total_reviews");
                    
                    // Handle NULL values
                    if (res->isNull("average_rating")) {
                        stat["average_rating"] = 0.0;
                        stat["lowest_rating"] = 0;
                        stat["highest_rating"] = 0;
                    } else {
                        stat["average_rating"] = static_cast<double>(res->getDouble("average_rating"));
                        stat["lowest_rating"] = res->getInt("lowest_rating");
                        stat["highest_rating"] = res->getInt("highest_rating");
                    }
                    
                    stats.push_back(std::move(stat));
                }
                
                result["rating_statistics"] = std::move(stats);
                return crow::response(200, result);
            });
        }
    );
    
    // Get user's reviewed places - FIXED: Use string parameter instead of int
    CROW_ROUTE(app, "/api/users/<string>/reviewed-places").methods("GET"_method)(
        [](const crow::request& req, const string& user_id_str) {
            return executeQuery([&]() {
                int user_id = stoi(user_id_str);
                
                unique_ptr<sql::Connection> con(getConnection());
                unique_ptr<sql::PreparedStatement> pstmt(con->prepareStatement(
                    "SELECT p.place_id, p.name, p.description, p.latitude, p.longitude, "
                    "ur.stars as user_rating, ur.comment as user_comment "
                    "FROM places p "
                    "JOIN ratings ur ON p.place_id = ur.place_id AND ur.user_id = ? "
                    "ORDER BY ur.created_at DESC"
                ));
                
                pstmt->setInt(1, user_id);
                unique_ptr<sql::ResultSet> res(pstmt->executeQuery());
                
                crow::json::wvalue result;
                vector<crow::json::wvalue> places;
                
                while (res->next()) {
                    crow::json::wvalue place;
                    place["place_id"] = res->getInt("place_id");
                    place["name"] = res->getString("name");
                    place["description"] = res->getString("description");
                    place["latitude"] = static_cast<double>(res->getDouble("latitude"));
                    place["longitude"] = static_cast<double>(res->getDouble("longitude"));
                    place["user_rating"] = res->getInt("user_rating");
                    place["user_comment"] = res->getString("user_comment");
                    places.push_back(std::move(place));
                }
                
                result["reviewed_places"] = std::move(places);
                return crow::response(200, result);
            });
        }
    );
    
    // Find nearby places
    CROW_ROUTE(app, "/api/places/nearby").methods("POST"_method)(
        [](const crow::request& req) {
            auto x = crow::json::load(req.body);
            if (!x) return crow::response(400, "Invalid JSON");
            
            if (!x.has("latitude") || !x.has("longitude") || !x.has("radius")) {
                return crow::response(400, "Missing coordinates or radius");
            }
            
            double latitude = x["latitude"].d();
            double longitude = x["longitude"].d();
            double radius = x["radius"].d();  // in kilometers
            
            return executeQuery([&]() {
                unique_ptr<sql::Connection> con(getConnection());
                unique_ptr<sql::PreparedStatement> pstmt(con->prepareStatement(
                    // Simplified distance calculation
                    "SELECT p.*, "
                    "(6371 * acos(cos(radians(?)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - "
                    "radians(?)) + sin(radians(?)) * sin(radians(p.latitude)))) AS distance "
                    "FROM places p "
                    "HAVING distance < ? "
                    "ORDER BY distance"
                ));
                
                pstmt->setDouble(1, latitude);
                pstmt->setDouble(2, longitude);
                pstmt->setDouble(3, latitude);
                pstmt->setDouble(4, radius);
                
                unique_ptr<sql::ResultSet> res(pstmt->executeQuery());
                
                crow::json::wvalue result;
                vector<crow::json::wvalue> places;
                
                while (res->next()) {
                    crow::json::wvalue place;
                    place["place_id"] = res->getInt("place_id");
                    place["name"] = res->getString("name");
                    place["description"] = res->getString("description");
                    place["latitude"] = static_cast<double>(res->getDouble("latitude"));
                    place["longitude"] = static_cast<double>(res->getDouble("longitude"));
                    place["distance"] = static_cast<double>(res->getDouble("distance"));
                    places.push_back(std::move(place));
                }
                
                result["nearby_places"] = std::move(places);
                return crow::response(200, result);
            });
        }
    );

    // Start the server
    cout << "Starting Crow server on port 18080..." << endl;
    app.port(18080).multithreaded().run();

    return 0;
}