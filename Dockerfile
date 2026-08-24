# Stage 1: Build Spring Boot backend with Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Production runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app
USER appuser

COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
ENV FILE_UPLOAD_DIR=/app/uploads
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
