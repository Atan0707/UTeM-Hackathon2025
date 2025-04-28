#include <iostream>
#include <mysql_driver.h>
#include <mysql_connection.h>
#include <cppconn/statement.h>
#include <cppconn/resultset.h>
#include <crow_all.h>

using namespace std;    

int main() {
    try {
        sql::mysql::MySQL_Driver* driver;
        sql::Connection* con;
        sql::Statement* stmt;
        sql::ResultSet* res;

        driver = sql::mysql::get_mysql_driver_instance();
        con = driver->connect("http://127.0.0.1:3306", "root", "root");
        con->setSchema("utem_hackathon");

        stmt = con->createStatement();
        res = stmt->executeQuery("SELECT * FROM users");

        while (res->next()) {
            std::cout << "User ID: " << res->getInt("user_id") << std::endl;
            std::cout << "Username: " << res->getString("username") << std::endl;
            std::cout << "Email: " << res->getString("email") << std::endl;
            std::cout << "Password: " << res->getString("password") << std::endl;
        }

    }
    catch (sql::SQLException& e) {
        std::cerr << "SQLException: " << e.what() << std::endl;
        return 1;
    }
    cout << "Test" << endl;
    return 0;



    return 0;
}
