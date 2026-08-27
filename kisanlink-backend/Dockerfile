# Multi-stage build for KisanLink Spring Boot Backend
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /app

# Copy Maven wrapper and dependencies specification
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B || true

# Copy source code and build production jar
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# Minimal runtime stage
FROM eclipse-temurin:25-jre
WORKDIR /app

# Create unprivileged application user
RUN groupadd -r kisanlink && useradd -r -g kisanlink kisanlink
USER kisanlink:kisanlink

# Copy executable jar from builder stage
COPY --from=builder /app/target/kisanlink-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENV SPRING_PROFILES_ACTIVE=postgres
ENV PORT=8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
