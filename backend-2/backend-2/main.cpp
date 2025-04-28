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

    // -------------------- Advanced SQL Operations --------------------
    
    // Get top-rated places (using aggregation)
    CROW_ROUTE(app, "/api/places/top-rated").methods(crow::HTTPMethod::GET)
    ([](const crow::request& req) {
        return executeQuery([]() {
            unique_ptr<sql::Connection> con(getConnection());
            unique_ptr<sql::Statement> stmt(con->createStatement());
            
            // Using AVG aggregation and GROUP BY to get average rating for each place
            unique_ptr<sql::ResultSet> res(stmt->executeQuery(
                "SELECT p.place_id, p.name, p.description, p.latitude, p.longitude, "
                "AVG(r.stars) as average_rating, COUNT(r.rating_id) as review_count "
                "FROM places p "
                "LEFT JOIN ratings r ON p.place_id = r.place_id "
                "GROUP BY p.place_id "
                "HAVING COUNT(r.rating_id) > 0 "  // Only include places with at least one review
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
                place["latitude"] = res->getDouble("latitude");
                place["longitude"] = res->getDouble("longitude");
                place["average_rating"] = res->getDouble("average_rating");
                place["review_count"] = res->getInt("review_count");
                places.push_back(std::move(place));
            }
            
            result["top_rated_places"] = std::move(places);
            return crow::response(200, result);
        });
    });
    
    // Get rating statistics by place (aggregation and grouping)
    CROW_ROUTE(app, "/api/statistics/ratings").methods(crow::HTTPMethod::GET)
    ([](const crow::request& req) {
        return executeQuery([]() {
            unique_ptr<sql::Connection> con(getConnection());
            unique_ptr<sql::Statement> stmt(con->createStatement());
            
            // Use multiple aggregation functions (COUNT, AVG, MIN, MAX, SUM)
            unique_ptr<sql::ResultSet> res(stmt->executeQuery(
                "SELECT p.place_id, p.name, "
                "COUNT(r.rating_id) as total_reviews, "
                "AVG(r.stars) as average_rating, "
                "MIN(r.stars) as lowest_rating, "
                "MAX(r.stars) as highest_rating, "
                "SUM(r.stars) as sum_of_ratings, "
                "COUNT(CASE WHEN r.stars = 5 THEN 1 END) as five_star_count, "
                "COUNT(CASE WHEN r.stars = 1 THEN 1 END) as one_star_count "
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
                
                // Handle NULL values for places with no ratings
                if (res->isNull("average_rating")) {
                    stat["average_rating"] = 0;
                    stat["lowest_rating"] = 0;
                    stat["highest_rating"] = 0;
                    stat["sum_of_ratings"] = 0;
                } else {
                    stat["average_rating"] = res->getDouble("average_rating");
                    stat["lowest_rating"] = res->getInt("lowest_rating");
                    stat["highest_rating"] = res->getInt("highest_rating");
                    stat["sum_of_ratings"] = res->getInt("sum_of_ratings");
                }
                
                stat["five_star_count"] = res->getInt("five_star_count");
                stat["one_star_count"] = res->getInt("one_star_count");
                stats.push_back(std::move(stat));
            }
            
            result["rating_statistics"] = std::move(stats);
            return crow::response(200, result);
        });
    });
    
    // Get places with user review info (complex JOIN with subquery)
    CROW_ROUTE(app, "/api/users/<int>/reviewed-places").methods(crow::HTTPMethod::GET)
    ([](const crow::request& req, int user_id) {
        return executeQuery([&]() {
            unique_ptr<sql::Connection> con(getConnection());
            unique_ptr<sql::PreparedStatement> pstmt(con->prepareStatement(
                "SELECT p.place_id, p.name, p.description, p.latitude, p.longitude, "
                "ur.stars as user_rating, ur.comment as user_comment, "
                "(SELECT AVG(r.stars) FROM ratings r WHERE r.place_id = p.place_id) as average_rating, "
                "(SELECT COUNT(*) FROM ratings r WHERE r.place_id = p.place_id) as review_count "
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
                place["latitude"] = res->getDouble("latitude");
                place["longitude"] = res->getDouble("longitude");
                place["user_rating"] = res->getInt("user_rating");
                place["user_comment"] = res->getString("user_comment");
                
                // Handle NULL values for places with no other ratings
                if (res->isNull("average_rating")) {
                    place["average_rating"] = res->getInt("user_rating");  // Only this user's rating
                } else {
                    place["average_rating"] = res->getDouble("average_rating");
                }
                
                place["review_count"] = res->getInt("review_count");
                places.push_back(std::move(place));
            }
            
            result["reviewed_places"] = std::move(places);
            return crow::response(200, result);
        });
    });
    
    // Find nearby places with ratings (using distance calculation)
    CROW_ROUTE(app, "/api/places/nearby").methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if (!x) {
            return crow::response(400, "Invalid JSON");
        }
        
        if (!x.has("latitude") || !x.has("longitude") || !x.has("radius")) {
            return crow::response(400, "Missing coordinates or radius");
        }
        
        double latitude = x["latitude"].d();
        double longitude = x["longitude"].d();
        double radius = x["radius"].d();  // in kilometers
        
        return executeQuery([&]() {
            unique_ptr<sql::Connection> con(getConnection());
            unique_ptr<sql::PreparedStatement> pstmt(con->prepareStatement(
                // Haversine formula to calculate distance
                "SELECT p.*, "
                "(6371 * acos(cos(radians(?)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - "
                "radians(?)) + sin(radians(?)) * sin(radians(p.latitude)))) AS distance, "
                "(SELECT AVG(r.stars) FROM ratings r WHERE r.place_id = p.place_id) as avg_rating, "
                "(SELECT COUNT(*) FROM ratings r WHERE r.place_id = p.place_id) as review_count "
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
                place["latitude"] = res->getDouble("latitude");
                place["longitude"] = res->getDouble("longitude");
                place["distance"] = res->getDouble("distance");  // Distance in km
                
                // Handle NULL values for places with no ratings
                if (res->isNull("avg_rating")) {
                    place["avg_rating"] = 0;
                } else {
                    place["avg_rating"] = res->getDouble("avg_rating");
                }
                
                place["review_count"] = res->getInt("review_count");
                places.push_back(std::move(place));
            }
            
            result["nearby_places"] = std::move(places);
            return crow::response(200, result);
        });
    });
    
    // Get user activity statistics
    CROW_ROUTE(app, "/api/statistics/users").methods(crow::HTTPMethod::GET)
    ([](const crow::request& req) {
        return executeQuery([]() {
            unique_ptr<sql::Connection> con(getConnection());
            unique_ptr<sql::Statement> stmt(con->createStatement());
            
            // Complex query with multiple JOINs, subqueries, and aggregations
            unique_ptr<sql::ResultSet> res(stmt->executeQuery(
                "SELECT u.user_id, u.username, "
                "COUNT(r.rating_id) as total_reviews, "
                "AVG(r.stars) as average_rating_given, "
                "(SELECT COUNT(*) FROM places p WHERE p.place_id IN "
                "  (SELECT DISTINCT r2.place_id FROM ratings r2 WHERE r2.user_id = u.user_id)) as unique_places_rated, "
                "(SELECT MAX(r3.created_at) FROM ratings r3 WHERE r3.user_id = u.user_id) as last_activity "
                "FROM users u "
                "LEFT JOIN ratings r ON u.user_id = r.user_id "
                "GROUP BY u.user_id "
                "ORDER BY total_reviews DESC"
            ));
            
            crow::json::wvalue result;
            vector<crow::json::wvalue> users;
            
            while (res->next()) {
                crow::json::wvalue user;
                user["user_id"] = res->getInt("user_id");
                user["username"] = res->getString("username");
                user["total_reviews"] = res->getInt("total_reviews");
                
                // Handle NULL values for users with no reviews
                if (res->isNull("average_rating_given")) {
                    user["average_rating_given"] = 0;
                } else {
                    user["average_rating_given"] = res->getDouble("average_rating_given");
                }
                
                user["unique_places_rated"] = res->getInt("unique_places_rated");
                
                if (!res->isNull("last_activity")) {
                    user["last_activity"] = res->getString("last_activity");
                }
                
                users.push_back(std::move(user));
            }
            
            result["user_statistics"] = std::move(users);
            return crow::response(200, result);
        });
    });

    // Start the server
    cout << "Starting Crow server on port 8080..." << endl;
    app.port(8080).multithreaded().run();

    return 0;
}
