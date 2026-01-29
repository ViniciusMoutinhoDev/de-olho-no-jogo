package com.vini.deolhonojogo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/test")
    public String teste() {
        return "Backend conectado com sucesso";
    }
}
