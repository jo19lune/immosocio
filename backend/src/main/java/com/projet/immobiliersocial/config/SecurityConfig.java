package com.projet.immobiliersocial.config;

import com.projet.immobiliersocial.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final AppProperties appProperties;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ── Auth — entièrement public ──────────────────────────────
                .requestMatchers("/api/auth/**").permitAll()

                // ── Images locales — accès public sans JWT ──────────────────
                .requestMatchers("/images/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()

                // ── WebSocket — SockJS nécessite des requêtes HTTP initiales ─
                .requestMatchers("/ws/**").permitAll()

                // ── Annonces — lecture publique ────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/annonces/recherche").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/annonces/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/annonces").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/annonces/segment/**").permitAll()

                // ── Commentaires annonces — lecture publique ───────────────
                // (fix : les commentaires doivent être visibles sans connexion)
                .requestMatchers(HttpMethod.GET, "/api/annonces/*/commentaires").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/annonces/*/commentaires/*/reponses").permitAll()

                // ── Publications — GET public (filtrage visibilité dans controller)
                .requestMatchers(HttpMethod.GET, "/api/publications").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/publications/{id}/commentaires").permitAll()

                // ── Rôles spécifiques ──────────────────────────────────────
                .requestMatchers("/api/annonces/mes-annonces/**").hasAnyRole("PROPRIETAIRE", "LOCATAIRE", "SUPERADMIN")
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPERADMIN")

                // ── Tout le reste : authentifié ────────────────────────────
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> allowedOrigins = appProperties.getUrls();

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
