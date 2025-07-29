#!/bin/bash

# RoboDickV2 Service Manager for Linux/WSL
# Starts all three NodeJS services in the correct order

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# PID files to track processes
PIDDIR="./pids"
IMAGE_SERVICE_PID="$PIDDIR/image-service.pid"
PORTAL_PID="$PIDDIR/portal.pid"
DISCORD_BOT_PID="$PIDDIR/discord-bot.pid"

# Create PID directory if it doesn't exist
mkdir -p "$PIDDIR"

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if a process is running
is_process_running() {
    local pid_file=$1
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            return 0  # Process is running
        else
            rm -f "$pid_file"  # Clean up stale PID file
            return 1  # Process is not running
        fi
    fi
    return 1  # PID file doesn't exist
}

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if is_process_running "$pid_file"; then
        local pid=$(cat "$pid_file")
        print_color $YELLOW "Stopping $service_name (PID: $pid)..."
        
        # Try graceful shutdown first
        kill "$pid" 2>/dev/null
        sleep 2
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            print_color $YELLOW "Force stopping $service_name..."
            kill -9 "$pid" 2>/dev/null
        fi
        
        rm -f "$pid_file"
        print_color $GREEN "✅ $service_name stopped"
    else
        print_color $YELLOW "$service_name not running"
    fi
}

# Function to force cleanup all related processes
force_cleanup() {
    print_color $YELLOW "🧹 Force cleaning up all Node.js processes..."
    
    # Kill all node processes
    killall node 2>/dev/null || true
    
    # Clean up PID files
    rm -f "$IMAGE_SERVICE_PID" "$PORTAL_PID" "$DISCORD_BOT_PID"
    
    print_color $GREEN "✅ Force cleanup completed!"
}

# Function to stop all services
stop_all_services() {
    print_color $RED "🛑 Stopping all services..."
    
    stop_service "Discord Bot" "$DISCORD_BOT_PID"
    stop_service "Portal" "$PORTAL_PID"
    stop_service "Image Service" "$IMAGE_SERVICE_PID"
    
    # Also kill any remaining node processes
    killall node 2>/dev/null || true
    
    print_color $GREEN "✅ All services stopped!"
}

# Function to start a service
start_service() {
    local service_name=$1
    local directory=$2
    local pid_file=$3
    
    # Check if service is already running
    if is_process_running "$pid_file"; then
        local existing_pid=$(cat "$pid_file")
        print_color $YELLOW "$service_name already running (PID: $existing_pid)"
        return 0
    fi
    
    print_color $GREEN "Starting $service_name..."
    
    cd "$directory"
    nohup npm run dev > "../logs/${service_name,,}.log" 2>&1 &
    local pid=$!
    echo "$pid" > "../$pid_file"
    cd ..
    
    # Wait a moment and check if the process is still running
    sleep 2
    if is_process_running "$pid_file"; then
        print_color $GREEN "✅ $service_name started (PID: $pid)"
        return 0
    else
        print_color $RED "❌ Failed to start $service_name"
        return 1
    fi
}

# Function to start all services
start_all_services() {
    print_color $BLUE "🚀 Starting RoboDickV2 services in order..."
    
    # Quick cleanup of any orphaned processes first
    killall node 2>/dev/null || true
    
    # Create logs directory
    mkdir -p logs
    
    # 1. Start Image Service
    if ! start_service "Image Service" "image-service" "$IMAGE_SERVICE_PID"; then
        return 1
    fi
    sleep 3
    
    # 2. Start Portal
    if ! start_service "Portal" "portal" "$PORTAL_PID"; then
        return 1
    fi
    sleep 3
    
    # 3. Start Discord Bot
    if ! start_service "Discord Bot" "discord-bot" "$DISCORD_BOT_PID"; then
        return 1
    fi
    
    print_color $BLUE "🎉 All services started successfully!"
    print_color $YELLOW "Logs are available in the ./logs/ directory"
    return 0
}

# Function to show service status
show_status() {
    print_color $BLUE "\n📊 Service Status:"
    
    if is_process_running "$IMAGE_SERVICE_PID"; then
        local pid=$(cat "$IMAGE_SERVICE_PID")
        print_color $GREEN "Image Service: ✅ Running (PID: $pid)"
    else
        print_color $RED "Image Service: ❌ Not Running"
    fi
    
    if is_process_running "$PORTAL_PID"; then
        local pid=$(cat "$PORTAL_PID")
        print_color $GREEN "Portal: ✅ Running (PID: $pid)"
    else
        print_color $RED "Portal: ❌ Not Running"
    fi
    
    if is_process_running "$DISCORD_BOT_PID"; then
        local pid=$(cat "$DISCORD_BOT_PID")
        print_color $GREEN "Discord Bot: ✅ Running (PID: $pid)"
    else
        print_color $RED "Discord Bot: ❌ Not Running"
    fi
}

# Function to restart all services
restart_all_services() {
    print_color $PURPLE "\n🔄 Restarting all services..."
    stop_all_services
    sleep 2
    start_all_services
}

# Function to show logs
show_logs() {
    local service=$1
    case $service in
        "image"|"image-service")
            tail -f logs/image-service.log
            ;;
        "portal")
            tail -f logs/portal.log
            ;;
        "discord"|"bot"|"discord-bot")
            tail -f logs/discord-bot.log
            ;;
        *)
            print_color $RED "Unknown service. Use: image, portal, or discord"
            ;;
    esac
}

# Function to show help
show_help() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}🤖 RoboDickV2 Service Manager${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  ${GREEN}./start.sh${NC}              Start all services"
    echo -e "  ${GREEN}./start.sh start${NC}        Start all services"
    echo -e "  ${GREEN}./start.sh stop${NC}         Stop all services"
    echo -e "  ${GREEN}./start.sh restart${NC}      Restart all services"
    echo -e "  ${GREEN}./start.sh status${NC}       Show service status"
    echo -e "  ${GREEN}./start.sh cleanup${NC}      Force cleanup all processes"
    echo -e "  ${GREEN}./start.sh logs <service>${NC} Show logs (image/portal/discord)"
    echo -e "  ${GREEN}./start.sh interactive${NC}   Start interactive mode"
    echo -e "  ${GREEN}./start.sh help${NC}         Show this help"
    echo
    echo -e "${YELLOW}Interactive mode commands:${NC}"
    echo -e "  ${GREEN}r, restart${NC}      Restart all services"
    echo -e "  ${GREEN}s, status${NC}       Show service status"
    echo -e "  ${GREEN}stop${NC}            Stop all services"
    echo -e "  ${GREEN}f, force-cleanup${NC} Force cleanup all processes"
    echo -e "  ${GREEN}logs <service>${NC}   Show logs"
    echo -e "  ${GREEN}q, quit${NC}         Stop services and exit"
    echo
}

# Function for interactive mode
interactive_mode() {
    print_color $BLUE "======================================"
    print_color $BLUE "🤖 RoboDickV2 Interactive Manager"
    print_color $BLUE "======================================"
    
    # Check if any services are already running
    local services_running=false
    if is_process_running "$IMAGE_SERVICE_PID" || is_process_running "$PORTAL_PID" || is_process_running "$DISCORD_BOT_PID"; then
        services_running=true
        print_color $YELLOW "⚠️  Some services are already running!"
        show_status
        echo
        print_color $YELLOW "Options:"
        print_color $GREEN "  [c]ontinue    - Use existing services"
        print_color $GREEN "  [r]estart     - Stop and restart all services"
        print_color $GREEN "  [f]orce       - Force cleanup and start fresh"
        print_color $RED "  [q]uit        - Exit without changes"
        
        while true; do
            read -p "Choose action [c/r/f/q]: " choice
            case $choice in
                "c"|"continue")
                    print_color $GREEN "✅ Continuing with existing services"
                    break
                    ;;
                "r"|"restart")
                    restart_all_services
                    break
                    ;;
                "f"|"force")
                    force_cleanup
                    sleep 1
                    start_all_services
                    break
                    ;;
                "q"|"quit")
                    print_color $BLUE "👋 Goodbye!"
                    exit 0
                    ;;
                *)
                    print_color $RED "Invalid choice. Use c, r, f, or q."
                    ;;
            esac
        done
    else
        start_all_services
    fi
    
    while true; do
        echo
        print_color $YELLOW "Commands: [r]estart, [s]tatus, [stop], [f]orce-cleanup, [logs <service>], [q]uit"
        read -p "Enter command: " input
        
        case $input in
            "r"|"restart")
                restart_all_services
                ;;
            "s"|"status")
                show_status
                ;;
            "stop")
                stop_all_services
                ;;
            "f"|"force"|"force-cleanup")
                force_cleanup
                ;;
            logs*)
                service=$(echo $input | cut -d' ' -f2)
                if [[ -n "$service" ]]; then
                    show_logs "$service"
                else
                    print_color $RED "Please specify a service: logs <image|portal|discord>"
                fi
                ;;
            "q"|"quit")
                stop_all_services
                print_color $BLUE "👋 Goodbye!"
                exit 0
                ;;
            "help")
                show_help
                ;;
            "")
                # Empty input, just continue
                ;;
            *)
                print_color $RED "Invalid command. Type 'help' for available commands."
                ;;
        esac
    done
}

# Cleanup function for graceful shutdown
cleanup() {
    print_color $YELLOW "\n🛑 Received interrupt signal..."
    stop_all_services
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if we're in the right directory
if [[ ! -d "image-service" ]] || [[ ! -d "portal" ]] || [[ ! -d "discord-bot" ]]; then
    print_color $RED "❌ Error: Please run this script from the RoboDickV2 root directory!"
    print_color $YELLOW "Expected directories: image-service, portal, discord-bot"
    exit 1
fi

# Main execution based on arguments
case "${1:-start}" in
    "start"|"")
        start_all_services
        ;;
    "stop")
        stop_all_services
        ;;
    "restart")
        restart_all_services
        ;;
    "status")
        show_status
        ;;
    "cleanup"|"force-cleanup")
        force_cleanup
        ;;
    "logs")
        if [[ -n "$2" ]]; then
            show_logs "$2"
        else
            print_color $RED "Please specify a service: logs <image|portal|discord>"
        fi
        ;;
    "interactive"|"i")
        interactive_mode
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_color $RED "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 