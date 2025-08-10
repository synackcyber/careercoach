FROM golang:1.23-alpine AS base

WORKDIR /app

# Copy source code
COPY . .

# Download dependencies and tidy
RUN go mod tidy

# Build the application
RUN go build -o main .

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"]