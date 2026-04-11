package com.projet.immobiliersocial;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ImmobiliersocialApplication {

	public static void main(String[] args) {
		SpringApplication.run(ImmobiliersocialApplication.class, args);
	}

}
