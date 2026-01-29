package com.vini.deolhonojogo.service;

import com.vini.deolhonojogo.entity.User;
import com.vini.deolhonojogo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public User createUser(User user) {
        return repository.save(user);
    }

    public List<User> listUsers() {
        return repository.findAll();
    }
}
