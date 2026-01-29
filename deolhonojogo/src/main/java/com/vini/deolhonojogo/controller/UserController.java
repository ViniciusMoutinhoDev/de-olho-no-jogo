package com.vini.deolhonojogo.controller;

import com.vini.deolhonojogo.entity.User;
import com.vini.deolhonojogo.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@CrossOrigin
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @PostMapping
    public User create(@RequestBody User user) {
        return service.createUser(user);
    }

    @GetMapping
    public List<User> list() {
        return service.listUsers();
    }
}
