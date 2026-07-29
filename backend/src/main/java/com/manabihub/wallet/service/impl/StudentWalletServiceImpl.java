package com.manabihub.wallet.service.impl;

import com.manabihub.common.constants.MessageCodes;
import com.manabihub.common.exception.BusinessException;
import com.manabihub.identity.entity.StudentProfile;
import com.manabihub.identity.repository.StudentProfileRepository;
import com.manabihub.identity.service.CurrentUserService;
import com.manabihub.order.entity.Order;
import com.manabihub.order.enums.OrderStatus;
import com.manabihub.order.repository.OrderRepository;
import com.manabihub.wallet.dto.response.StudentWalletSummaryResponse;
import com.manabihub.wallet.dto.response.WalletActivityResponse;
import com.manabihub.wallet.entity.Wallet;
import com.manabihub.wallet.entity.WalletTransaction;
import com.manabihub.wallet.enums.WalletTransactionSection;
import com.manabihub.wallet.mapper.WalletTransactionMapper;
import com.manabihub.wallet.repository.WalletTransactionRepository;
import com.manabihub.wallet.service.StudentWalletService;
import com.manabihub.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentWalletServiceImpl implements StudentWalletService {

    private final WalletService walletService;
    private final WalletTransactionRepository walletTransactionRepository;
    private final OrderRepository orderRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final CurrentUserService currentUserService;
    private final WalletTransactionMapper walletTransactionMapper;

    @Override
    public StudentWalletSummaryResponse getWalletSummary() {
        StudentProfile student = resolveStudent();
        Wallet wallet = walletService.getOrCreateStudentWallet(student);

        BigDecimal totalTopUps = walletTransactionRepository.findByWallet_IdOrderByCreatedAtDesc(wallet.getId())
                .stream()
                .filter(tx -> walletTransactionMapper.classify(tx) == WalletTransactionSection.TOP_UP)
                .map(WalletTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Order> orders = orderRepository.findByStudent_IdOrderByCreatedAtDesc(student.getId());
        BigDecimal totalPayments = sumOrdersByStatus(orders, OrderStatus.PAID);
        BigDecimal totalRefunds = sumOrdersByStatus(orders, OrderStatus.REFUNDED);

        return new StudentWalletSummaryResponse(
                wallet.getId(),
                wallet.getCurrency(),
                wallet.getBalance(),
                totalTopUps,
                totalPayments,
                totalRefunds,
                wallet.getUpdatedAt());
    }

    @Override
    public List<WalletActivityResponse> getWalletActivity() {
        StudentProfile student = resolveStudent();
        Wallet wallet = walletService.getOrCreateStudentWallet(student);

        List<WalletActivityResponse> activity = new ArrayList<>();

        walletTransactionRepository.findByWallet_IdOrderByCreatedAtDesc(wallet.getId()).stream()
                .filter(tx -> walletTransactionMapper.classify(tx) == WalletTransactionSection.TOP_UP)
                .map(walletTransactionMapper::toActivityResponse)
                .forEach(activity::add);

        for (Order order : orderRepository.findByStudent_IdOrderByCreatedAtDesc(student.getId())) {
            if (order.getStatus() == OrderStatus.REFUNDED) {
                activity.add(walletTransactionMapper.toActivityResponse(order, WalletTransactionSection.REFUND));
            } else if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.PENDING) {
                activity.add(walletTransactionMapper.toActivityResponse(order, WalletTransactionSection.PAYMENT));
            }
        }

        return activity.stream()
                .sorted(Comparator.comparing(WalletActivityResponse::occurredAt).reversed())
                .toList();
    }

    private BigDecimal sumOrdersByStatus(List<Order> orders, OrderStatus status) {
        return orders.stream()
                .filter(order -> order.getStatus() == status)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private StudentProfile resolveStudent() {
        return studentProfileRepository.findByUser_Id(currentUserService.getCurrentUserId())
                .orElseThrow(() -> new BusinessException(
                        MessageCodes.LEARNING_STUDENT_PROFILE_NOT_FOUND,
                        "Student profile was not found.",
                        HttpStatus.FORBIDDEN
                ));
    }
}
