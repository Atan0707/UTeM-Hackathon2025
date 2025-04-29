#include <iostream>
#include <string>
#include <cstdlib>

#ifdef _WIN32
#include <windows.h>
#include <tchar.h>
#else
#include <unistd.h>
#endif

class ExpressLauncher {
private:
    bool server_running = false;
    
    #ifdef _WIN32
    PROCESS_INFORMATION process_info;
    #else
    pid_t child_pid = 0;
    #endif

public:
    bool start() {
        if (server_running) {
            std::cout << "Express server is already running" << std::endl;
            return true;
        }

        std::cout << "Launching Express.js server..." << std::endl;
        
        #ifdef _WIN32
        // Windows implementation
        STARTUPINFOW startup_info;
        ZeroMemory(&startup_info, sizeof(startup_info));
        startup_info.cb = sizeof(startup_info);
        ZeroMemory(&process_info, sizeof(process_info));
        
        // Prepare command line
        std::wstring express_dir = L"C:\\Users\\hariz\\Desktop\\UTeM-Hackathon2025\\express-backend";
        std::wstring cmd = L"cmd.exe /c cd /d " + express_dir + L" && node bridge.js";
        
        // Make a writable copy of the command line
        wchar_t* cmdline = new wchar_t[cmd.length() + 1];
        wcscpy_s(cmdline, cmd.length() + 1, cmd.c_str());
        
        // Create process
        if (!CreateProcessW(
            NULL,                    // No module name (use command line)
            cmdline,                 // Command line
            NULL,                    // Process handle not inheritable
            NULL,                    // Thread handle not inheritable
            FALSE,                   // Set handle inheritance to FALSE
            CREATE_NO_WINDOW,        // Creation flags
            NULL,                    // Use parent's environment block
            NULL,                    // Use parent's starting directory 
            &startup_info,           // Pointer to STARTUPINFO structure
            &process_info)           // Pointer to PROCESS_INFORMATION structure
        ) {
            std::cerr << "CreateProcess failed with error: " << GetLastError() << std::endl;
            delete[] cmdline;
            return false;
        }
        
        // Free allocated memory
        delete[] cmdline;
        
        server_running = true;
        std::cout << "Express server started successfully with PID: " << process_info.dwProcessId << std::endl;
        return true;
        
        #else
        // Unix/Linux/Mac implementation
        child_pid = fork();
        
        if (child_pid < 0) {
            std::cerr << "Fork failed!" << std::endl;
            return false;
        } else if (child_pid == 0) {
            // Child process
            std::string express_dir = "/c/Users/hariz/Desktop/UTeM-Hackathon2025/express-backend";
            chdir(express_dir.c_str());
            execlp("node", "node", "bridge.js", NULL);
            
            // If execlp returns, it must have failed
            std::cerr << "Failed to launch Express server" << std::endl;
            exit(1);
        } else {
            // Parent process
            server_running = true;
            std::cout << "Express server started successfully with PID: " << child_pid << std::endl;
            return true;
        }
        #endif
    }
    
    void stop() {
        if (!server_running) {
            std::cout << "Express server is not running" << std::endl;
            return;
        }
        
        #ifdef _WIN32
        TerminateProcess(process_info.hProcess, 0);
        CloseHandle(process_info.hProcess);
        CloseHandle(process_info.hThread);
        #else
        if (child_pid > 0) {
            kill(child_pid, SIGTERM);
        }
        #endif
        
        server_running = false;
        std::cout << "Express server stopped" << std::endl;
    }
    
    ~ExpressLauncher() {
        if (server_running) {
            stop();
        }
    }
}; 